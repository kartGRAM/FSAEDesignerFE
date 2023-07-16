import store from '@store/store';
import {v4 as uuidv4} from 'uuid';
import {inWorker} from '@utils/helpers';
import {testUpdateNotify} from '@store/reducers/uiTempGeometryDesigner';
import {getDgd} from '@store/getDgd';
import {KinematicSolver} from '@gd/kinematics/Solver';
import {
  isWorkerMessage,
  FromParent,
  log,
  isCaseResults,
  CaseResults
} from '@worker/solverWorkerMessage';
import {ISnapshot} from '@gd/kinematics/ISnapshot';
import {setTests} from '@store/reducers/dataGeometryDesigner';
import {IFlowNode, IDataEdge} from './FlowNode';
import {StartNode, isStartNode, IStartNode} from './StartNode';
import {EndNode, isEndNode, IEndNode} from './EndNode';
import {ITest, IDataTest, isDataTest, IClipboardFlowNodes} from './ITest';
import {getFlowNode} from './RestoreData';
import validateGraph from './ValidateGraph';
import arrangeNodes from './ArrangeNodes';
import {isActionNode} from './ActionNode';
import {isCaseStartNode, isCaseEndNode} from './TypeGuards';

export class Test implements ITest {
  name: string;

  description: string;

  nodeID: string = uuidv4();

  idWoTest: string = '';

  changed = false;

  localStates: IDataTest[] = [];

  indexOfHistory: number = 0;

  undoBlockPoint: string = '';

  saveLocalState(changed: boolean = true): void {
    this.localStates = this.localStates.slice(
      0,
      this.localStates.length + this.indexOfHistory
    );
    const data = this.getData();
    this.localStates.push(data);
    this.indexOfHistory = 0;
    // セーブしたものをロードしておくことで、状態を最新とする。
    // これをやっておかないと、CopyFromが更新されなかったりする。
    this.loadLocalState(data);
    if (changed) this.changed = true;
  }

  loadLocalState(dataOrLocalStateID: IDataTest | string) {
    if (isDataTest(dataOrLocalStateID)) {
      const data = dataOrLocalStateID;
      this.name = data.name;
      this.description = data.description;
      this.nodeID = data.nodeID;
      this.idWoTest = data.idWoTest ?? '';
      this.edges = data.edges.reduce((prev, current) => {
        prev[`${current.source}@${current.target}`] = {...current};
        return prev;
      }, {} as {[index: string]: IDataEdge});
      this.nodes = data.nodes.reduce((prev, current) => {
        const node = getFlowNode(current);
        if (isStartNode(node)) this.startNode = node;
        if (isEndNode(node)) this.endNode = node;
        prev[current.nodeID] = node;
        return prev;
      }, {} as {[index: string]: IFlowNode});
      Object.values(this.nodes).forEach((node) => {
        if (node.copyFrom && node.setCopyFrom) {
          const org = this.nodes[node.copyFrom ?? ''];
          node.setCopyFrom(org ?? null);
        }
      });
      this.cleanData();
    } else {
      const idx = this.localStates.findIndex(
        (state) => state.localStateID === dataOrLocalStateID
      );
      if (idx >= 0) {
        const data = this.localStates[idx];
        this.indexOfHistory = idx + 1 - this.localStates.length;
        this.loadLocalState(data);
      }
    }
  }

  getLocalStateID(): string {
    return this.localStates[this.localStates.length + this.indexOfHistory - 1]
      .localStateID!;
  }

  squashLocalStates(from: string, to: string) {
    const iFrom = this.localStates.findIndex(
      (state) => state.localStateID === from
    );
    const iTo = this.localStates.findIndex(
      (state) => state.localStateID === to
    );

    if (iFrom >= 0 && iTo > iFrom + 1) {
      this.localStates = this.localStates.filter(
        (_, i) => i <= iFrom || i >= iTo
      );
    }
  }

  asLastestState() {
    this.localStates = this.localStates.slice(
      0,
      this.localStates.length + this.indexOfHistory
    );
    this.indexOfHistory = 0;
  }

  localRedo(): void {
    if (this.indexOfHistory >= 0) return;
    this.indexOfHistory++;
    this.loadLocalState(
      this.localStates[this.localStates.length + this.indexOfHistory - 1]
    );
    this.changed = true;
  }

  localUndo(): void {
    const idx = this.localStates.length + this.indexOfHistory - 1;
    if (idx <= 0) return;
    if (this.localStates[idx].localStateID === this.undoBlockPoint) return;

    this.indexOfHistory--;
    const newIdx = this.localStates.length + this.indexOfHistory - 1;
    this.loadLocalState(this.localStates[newIdx]);
    this.changed = true;

    if (newIdx === 0) {
      this.changed = false;
    }
  }

  get redoable(): boolean {
    if (this.indexOfHistory >= 0) return false;
    return true;
  }

  get undoable(): boolean {
    const idx = this.localStates.length + this.indexOfHistory - 1;
    if (idx <= 0) return false;
    return true;
  }

  addNode(node: IFlowNode): void {
    this.nodes[node.nodeID] = node;
    this.cleanData();
  }

  removeNode(node: {nodeID: string}): void {
    const id = node.nodeID;
    delete this.nodes[id];
    this.cleanData();
  }

  addEdge(edge: IDataEdge): void {
    if (edge.target === this.endNode.nodeID) {
      edge.data = {...edge.data, toEndNode: true};
    }
    this.edges[`${edge.source}@${edge.target}`] = edge;
    this.cleanData();
  }

  removeEdge(edge: {source: string; target: string}): void {
    const id = `${edge.source}@${edge.target}`;
    delete this.edges[id];
    this.cleanData();
  }

  arrange(
    widthSpaceAligningNodes: number,
    heightSpaceAligningNodes: number
  ): void {
    arrangeNodes(
      this.startNode,
      this.nodes,
      Object.values(this.edges),
      widthSpaceAligningNodes,
      heightSpaceAligningNodes
    );
  }

  tryConnect(source: string, target: string) {
    const tNode: IFlowNode | undefined = this.nodes[target];
    const sNode: IFlowNode | undefined = this.nodes[source];
    if (!tNode || !sNode) return false;
    if (
      !tNode.acceptable(
        sNode,
        this.nodes,
        this.edgesFromTarget,
        this.edgesFromSourceNode
      )
    ) {
      return false;
    }
    if (this.edges[`${source}@${target}`]) return false;

    const edgeToAppend: IDataEdge = {
      isDataEdge: true,
      id: `${source}@${target}`,
      className: 'default',
      source,
      target,
      selected: false
    };
    const edges = Object.values(this.edges);
    edges.push(edgeToAppend);
    const edgesFromSourceNode: {[index: string]: IDataEdge[]} = {};
    const edgesFromTarget: {[index: string]: IDataEdge} = {};
    Object.values(this.nodes).forEach((node) => {
      edgesFromSourceNode[node.nodeID] = [];
    });
    edges.forEach((edge) => {
      edgesFromSourceNode[edge.source].push(edge);
      edgesFromTarget[edge.target] = edge;
    });
    if (!validateGraph(this.nodes, edgesFromTarget, edgesFromSourceNode))
      return false;

    this.addEdge(edgeToAppend);
    return true;
  }

  cleanData() {
    const {nodes} = this;
    const edgesFromSourceNode: {[index: string]: IDataEdge[]} = {};
    const edgesFromTarget: {[index: string]: IDataEdge} = {};

    const nodeIDs = Object.values(nodes).map((node) => {
      edgesFromSourceNode[node.nodeID] = [];
      return node.nodeID;
    });
    const edges = Object.values(this.edges);
    const deleteEdge = (edge: IDataEdge) => {
      delete this.edges[`${edge.source}@${edge.target}`];
    };

    const toTestEndEdges: IDataEdge[] = [];
    edges.forEach((edge) => {
      if (!nodeIDs.includes(edge.source) || !nodeIDs.includes(edge.target)) {
        deleteEdge(edge);
        return;
      }
      if (edge.target === this.endNode.nodeID) toTestEndEdges.push(edge);
      edgesFromSourceNode[edge.source].push(edge);
      edgesFromTarget[edge.target] = edge;
    });
    // testEndに行くCaseEndがそのあとにほかのテストがある場合、無駄なのでEdgeを削除
    toTestEndEdges.forEach((edge) => {
      if (edgesFromSourceNode[edge.source].length > 1) deleteEdge(edge);
    });
    this.edgesFromSourceNode = edgesFromSourceNode;
    this.edgesFromTarget = edgesFromTarget;
  }

  getData(): IDataTest {
    this.cleanData();
    const {name, description, nodeID, edges, nodes, idWoTest} = this;
    const dataNodes = [
      ...Object.values(nodes)
        .filter((node) => !node.copyFrom)
        .map((node) => node.getData(this.nodes)),
      ...Object.values(nodes)
        .filter((node) => !!node.copyFrom)
        .map((node) => node.getData(this.nodes))
    ];
    return {
      isDataTest: true,
      name,
      description,
      nodeID,
      idWoTest,
      nodes: dataNodes,
      edges: Object.values(edges),
      localStateID: uuidv4()
    };
  }

  copySelectedNodes(): IClipboardFlowNodes {
    const nodes = Object.values(this.nodes)
      .filter((node) => node.selected && !isStartNode(node) && !isEndNode(node))
      .map((node) => ({
        ...node.getData(this.nodes)
      }));

    const selectedNodeIDs = nodes.map((node) => node.nodeID);
    const edges = Object.values(this.edges).filter(
      (edge) =>
        edge.selected &&
        selectedNodeIDs.includes(edge.source) &&
        selectedNodeIDs.includes(edge.target)
    );
    return {isClipboardFlowNodes: true, isClipboardItem: true, nodes, edges};
  }

  dispatch(): void {
    const tests = getDgd().analysis;
    store.dispatch(
      setTests(
        tests.map((t) => {
          if (t.nodeID !== this.nodeID) return t;
          return this.getData();
        })
      )
    );
    this.changed = false;
  }

  nodes: {[index: string]: IFlowNode};

  edges: {[index: string]: IDataEdge} = {};

  edgesFromTarget: {[index: string]: IDataEdge} = {};

  edgesFromSourceNode: {[index: string]: IDataEdge[]} = {};

  startNode: IStartNode;

  endNode: IEndNode;

  constructor(params: {name: string; description: string} | IDataTest) {
    this.name = params.name;
    this.description = params.description;
    this.startNode = new StartNode({
      name: 'assemble & test start',
      position: {x: 0, y: 0}
    });
    this.endNode = new EndNode({
      name: 'test end',
      position: {x: 1000, y: 0}
    });

    this.nodes = [this.startNode, this.endNode].reduce((prev, current) => {
      prev[current.nodeID] = current;
      return prev;
    }, {} as {[index: string]: IFlowNode});
    if (isDataTest(params)) {
      this.loadLocalState(params);
    }
    this.saveLocalState(false);
  }

  validate(): boolean {
    const nodes = Object.values(this.nodes);
    for (const node of nodes) {
      if (!node.validate(this.edgesFromTarget, this.edgesFromSourceNode))
        return false;
    }

    if (
      !validateGraph(this.nodes, this.edgesFromTarget, this.edgesFromSourceNode)
    )
      return false;
    return true;
  }

  private _done: boolean = false;

  get done() {
    return this._done;
  }

  private set done(value: boolean) {
    this._done = value;
  }

  private _running: boolean = false;

  get running() {
    return this._running;
  }

  private set running(value: boolean) {
    this._running = value;
  }

  private worker: Worker | undefined = undefined;

  stop(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = undefined;
      this.running = false;
      this.done = false;
      store.dispatch(testUpdateNotify(this));
    }
  }

  run(): void {
    if (inWorker()) throw new Error('Task run is called in worker');
    const worker = new Worker(
      new URL('../../worker/solverWorker.ts', import.meta.url)
    );

    worker.onmessage = (e) => {
      const {data} = e;
      if (isWorkerMessage(data)) {
        // eslint-disable-next-line no-console
        console.log(`onmessage: ${data.message}`);
      }
      if (isCaseResults(data)) {
        worker.terminate();
        this.running = false;
        this.done = true;
        store.dispatch(testUpdateNotify(this));
        this.worker = undefined;
      }
    };

    worker.onerror = (e) => {
      // eslint-disable-next-line no-console
      console.log(`ERR = ${e}`);
      worker.terminate();
      this.running = false;
      this.done = false;
      store.dispatch(testUpdateNotify(this));
      this.worker = undefined;
    };

    this.running = true;
    this.done = false;
    store.dispatch(testUpdateNotify(this));
    this.worker = worker;
    const fromParent: FromParent = {
      nodeFrom: this.startNode.nodeID,
      testID: this.nodeID,
      state: getDgd()
    };
    worker.postMessage(fromParent);
  }

  async createChildWorker(
    nextNode: IFlowNode,
    state: ISnapshot
  ): Promise<CaseResults> {
    if (!inWorker())
      throw new Error('createChildWorker is called in main thread.');
    return new Promise<CaseResults>((resolve) => {
      const worker = new Worker(
        new URL('../../worker/solverWorker.ts', import.meta.url)
      );

      worker.onmessage = (e) => {
        const {data} = e;
        if (isWorkerMessage(data)) {
          log(data.message);
        }
        if (isCaseResults(data)) {
          const r = data;
          resolve(r);
        }
      };

      worker.onerror = (e) => {
        log(`ERR = ${e}`);
        worker.terminate();
        throw e;
      };

      const fromParent: FromParent = {
        nodeFrom: nextNode.nodeID,
        initialSnapshot: state,
        testID: this.nodeID,
        state: getDgd()
      };
      worker.postMessage(fromParent);
    });
  }

  async DFSNodes(
    node: IFlowNode,
    solver: KinematicSolver,
    ret: CaseResults,
    currentCase: string | undefined
  ): Promise<CaseResults> {
    log(`${node.name} start`);
    if (isEndNode(node)) {
      return ret;
    }
    if (isActionNode(node)) {
      node.action(
        solver,
        currentCase ? ret.caseResults[currentCase] : undefined
      );
    }
    if (isCaseStartNode(node)) {
      currentCase = node.nodeID;
      ret.caseResults[node.nodeID] = [];
    }
    if (isCaseEndNode(node)) {
      currentCase = undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const state = solver.getSnapshot();
    const edges = [...this.edgesFromSourceNode[node.nodeID]];
    const edge = edges.pop();
    if (edge) {
      const next = this.nodes[edge.target];
      await this.DFSNodes(next, solver, ret, currentCase);
    }

    /* const results = await Promise.all(
      edges.map((edge) => {
        const next = this.nodes[edge.target];
        return this.createChildWorker(next, state);
      })
    );
    results.forEach((result) => {
      ret.caseResults = {...ret.caseResults, ...result.caseResults};
    }); */

    return ret;
  }
}
