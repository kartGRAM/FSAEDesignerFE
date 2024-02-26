import store from '@store/store';
import {v4 as uuidv4} from 'uuid';
import {getDgd} from '@store/getDgd';
import {setTests} from '@store/reducers/dataGeometryDesigner';
import {testUpdateNotify} from '@store/reducers/uiTempGeometryDesigner';
import {NamedNumber, NamedVector3} from '@gd/NamedValues';
import {Vector3} from 'three';
import {createDummyDataControl} from '@gd/controls/IControls';
import {IFlowNode, IDataEdge} from './FlowNode';
import {StartNode, isStartNode, IStartNode} from './StartNode';
import {EndNode, isEndNode, IEndNode} from './EndNode';
import {
  ITest,
  IDataTest,
  isDataTest,
  IClipboardFlowNodes,
  ISteadySkidpadParams,
  IDataSteadySkidpadParams
} from './ITest';
import {getFlowNode} from './RestoreData';
import validateGraph from './ValidateGraph';
import arrangeNodes from './ArrangeNodes';
import {TestSolver} from './TestSolver';
import {ParameterSetter} from './ParameterSetter';

export const loadSteadySkidpadParams = (
  data: IDataSteadySkidpadParams
): ISteadySkidpadParams => {
  return {
    tireData: {...data.tireData},
    tireTorqueRatio: {...data.tireTorqueRatio},
    steering: data.steering
      ? new ParameterSetter(data.steering)
      : new ParameterSetter({
          type: 'Control',
          target: createDummyDataControl(),
          valueFormula: '0'
        }),
    steeringMaxStepSize: data.steeringMaxStepSize
      ? new NamedNumber({value: data.steeringMaxStepSize})
      : new NamedNumber({name: 'steeringMaxStepSize', value: 1}),
    velocity: new NamedNumber({value: data.velocity}),
    radius: new NamedNumber({value: data.radius}),
    globalCd: new NamedNumber({value: data.globalCd}),
    globalCl: new NamedNumber({value: data.globalCl}),
    searchMode: data.searchMode,
    velocityStepSize: data.velocityStepSize
      ? new NamedNumber({value: data.velocityStepSize})
      : new NamedNumber({name: 'velocityStepSize', value: 1}),
    radiusStepSize: data.radiusStepSize
      ? new NamedNumber({value: data.radiusStepSize})
      : new NamedNumber({name: 'radiusStepSize', value: -0.5}),
    storeIntermidiateResults: data.storeIntermidiateResults,
    gravity: data.gravity
      ? new NamedVector3({value: data.gravity})
      : new NamedVector3({name: 'accOfGravity', value: new Vector3(0, 0, -9.8)})
  };
};

export const saveSteadySkidpadParams = (
  params: ISteadySkidpadParams | undefined
): IDataSteadySkidpadParams | undefined => {
  if (!params) return undefined;
  return {
    tireData: {...params.tireData},
    tireTorqueRatio: {...params.tireTorqueRatio},
    steering: params.steering.getData(),
    steeringMaxStepSize: params.steeringMaxStepSize.getData(),
    velocity: params.velocity.getData(),
    radius: params.radius.getData(),
    globalCd: params.globalCd.getData(),
    globalCl: params.globalCl.getData(),
    searchMode: params.searchMode,
    velocityStepSize: params.velocityStepSize
      ? params.velocityStepSize.getData()
      : undefined,
    radiusStepSize: params.radiusStepSize
      ? params.radiusStepSize.getData()
      : undefined,
    storeIntermidiateResults: params.storeIntermidiateResults
  };
};

export const initialSteadySkidpadParams: () => ISteadySkidpadParams = () => ({
  tireData: {},
  tireTorqueRatio: {},
  steering: new ParameterSetter({
    type: 'Control',
    target: createDummyDataControl(),
    valueFormula: '0'
  }),
  steeringMaxStepSize: new NamedNumber({
    name: 'steeringMaxStepSize',
    value: 1
  }),
  velocity: new NamedNumber({name: 'velocity', value: 10}),
  radius: new NamedNumber({name: 'radius', value: 7.625}),
  globalCd: new NamedNumber({name: 'global cd', value: 0}),
  globalCl: new NamedNumber({name: 'global cl', value: 0}),
  searchMode: 'binary',
  velocityStepSize: new NamedNumber({name: 'velocityStepSize', value: 1}),
  radiusStepSize: new NamedNumber({name: 'radiusStepSize', value: -0.5}),
  storeIntermidiateResults: false,
  gravity: new NamedVector3({
    name: 'accOfGravity',
    value: new Vector3(0, 0, -9.8)
  })
});

export class Test implements ITest {
  name: string;

  description: string;

  nodeID: string = uuidv4();

  idWoTest: string = '';

  private savedStateID: string;

  get changed(): boolean {
    const state =
      this.localStates[this.localStates.length + this.indexOfHistory - 1];
    return this.savedStateID !== state.localStateID;
  }

  localStates: IDataTest[] = [];

  indexOfHistory: number = 0;

  undoBlockPoint: string = '';

  saveLocalState(): void {
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
  }

  loadLocalState(dataOrLocalStateID: IDataTest | string) {
    if (isDataTest(dataOrLocalStateID)) {
      const data = dataOrLocalStateID;
      this.name = data.name;
      this.description = data.description;
      this.nodeID = data.nodeID;
      this.calculateSteadyStateDynamics = !!data.calculateSteadyStateDynamics;
      this.steadyStateDynamicsMode =
        data.steadyStateDynamicsMode ?? 'SkidpadMaxV';
      this.steadySkidpadParams = data.steadySkidpadParams
        ? loadSteadySkidpadParams(data.steadySkidpadParams)
        : undefined;
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
      .localStateID;
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
  }

  localUndo(): void {
    const idx = this.localStates.length + this.indexOfHistory - 1;
    if (idx <= 0) return;
    if (this.localStates[idx].localStateID === this.undoBlockPoint) return;

    this.indexOfHistory--;
    const newIdx = this.localStates.length + this.indexOfHistory - 1;
    this.loadLocalState(this.localStates[newIdx]);
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
      heightSpaceAligningNodes,
      true,
      this.endNode
    );
    arrangeNodes(
      this.endNode,
      this.nodes,
      Object.values(this.edges),
      widthSpaceAligningNodes,
      heightSpaceAligningNodes,
      false
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
    const {
      name,
      description,
      nodeID,
      edges,
      nodes,
      idWoTest,
      calculateSteadyStateDynamics,
      steadyStateDynamicsMode
    } = this;
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
      localStateID: uuidv4(),
      calculateSteadyStateDynamics,
      steadyStateDynamicsMode,
      steadySkidpadParams: saveSteadySkidpadParams(this.steadySkidpadParams)
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

  get isValid(): boolean {
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

  dispatch(): void {
    const tests = getDgd().analysis;
    store.dispatch(
      setTests(
        tests.map((t) => {
          if (t.nodeID !== this.nodeID) return t;
          const data =
            this.localStates[this.localStates.length + this.indexOfHistory - 1];
          this.savedStateID = data.localStateID;
          return data;
        })
      )
    );
    // Applyボタンを更新
    store.dispatch(testUpdateNotify(this));
  }

  nodes: {[index: string]: IFlowNode};

  edges: {[index: string]: IDataEdge} = {};

  edgesFromTarget: {[index: string]: IDataEdge} = {};

  edgesFromSourceNode: {[index: string]: IDataEdge[]} = {};

  startNode: IStartNode;

  endNode: IEndNode;

  calculateSteadyStateDynamics: boolean;

  steadyStateDynamicsMode: 'SkidpadMaxV' | 'SkidpadMinR';

  steadySkidpadParams?: ISteadySkidpadParams | undefined;

  constructor(params: {name: string; description: string} | IDataTest) {
    this.name = params.name;
    this.description = params.description;
    this.calculateSteadyStateDynamics = false;
    this.steadyStateDynamicsMode = 'SkidpadMaxV';
    this.steadySkidpadParams = undefined;

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
    this.saveLocalState();
    this.savedStateID = this.localStates[0].localStateID;
    this.notCompletedSolver = this.createSolver();
  }

  private createSolver(): TestSolver {
    return new TestSolver(this, (solver: TestSolver) => {
      this.completedSolver = solver;
      this.notCompletedSolver = this.createSolver();
      this.completedStateID = [this.getLocalStateID()];
    });
  }

  private completedSolver: TestSolver | undefined;

  private notCompletedSolver: TestSolver;

  private completedStateID: string[] = [];

  addCompletedState() {
    if (!this.completedStateID.includes(this.getLocalStateID())) {
      this.completedStateID = [
        ...this.completedStateID,
        this.getLocalStateID()
      ];
    }
  }

  get solver(): TestSolver {
    const id = getDgd().idWoTest;
    if (
      this.completedStateID.includes(this.getLocalStateID()) &&
      this.completedSolver &&
      this.completedSolver.dgdID === id
    ) {
      return this.completedSolver;
    }
    return this.notCompletedSolver;
  }
}
