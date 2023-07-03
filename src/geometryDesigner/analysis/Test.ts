import {Node, Edge} from 'reactflow';
import {v4 as uuidv4} from 'uuid';
import store from '@store/store';
import {setTests} from '@store/reducers/dataGeometryDesigner';
import {IFlowNode, IDataEdge} from './FlowNode';
import {StartNode, isStartNode, IStartNode} from './StartNode';
import {EndNode, isEndNode, IEndNode} from './EndNode';
import {ITest, IDataTest, isDataTest} from './ITest';
import {getEdge, getFlowNode} from './RestoreData';
import validateGraph from './ValidateGraph';
import arrangeNodes from './ArrangeNodes';
import {IClipboardFlowNodes} from './ClipboardFlowNode';

export class Test implements ITest {
  name: string;

  description: string;

  nodeID: string = uuidv4();

  changed = false;

  done = false;

  ready = false;

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
    this.loadLocalState(data);
    if (changed) this.changed = true;
  }

  loadLocalState(dataOrLocalStateID: IDataTest | string) {
    if (isDataTest(dataOrLocalStateID)) {
      const data = dataOrLocalStateID;
      this.name = data.name;
      this.description = data.description;
      this.nodeID = data.nodeID;
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
    const {name, description, nodeID, edges, nodes} = this;
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
      nodes: dataNodes,
      edges: Object.values(edges),
      localStateID: uuidv4()
    };
  }

  getRFNodesAndEdges(canvasUpdate: () => void): {nodes: Node[]; edges: Edge[]} {
    return {
      nodes: Object.values(this.nodes).map((node) =>
        node.getRFNode(this, canvasUpdate)
      ),
      edges: Object.values(this.edges).map((edge) => getEdge(edge))
    };
  }

  dispatch(): void {
    const tests = store.getState().dgd.present.analysis;
    store.dispatch(
      setTests(
        tests.map((test) => {
          if (test.nodeID !== this.nodeID) return test;
          return this.getData();
        })
      )
    );

    this.changed = false;
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
}
