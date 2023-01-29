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

export class Test implements ITest {
  name: string;

  description: string;

  nodeID: string = uuidv4();

  changed = false;

  done = false;

  ready = false;

  addNode(node: IFlowNode): void {
    this.nodes[node.nodeID] = node;
    this.cleanData();
    this.changed = true;
  }

  removeNode(node: {nodeID: string}): void {
    const id = node.nodeID;
    delete this.nodes[id];
    this.cleanData();
    this.changed = true;
  }

  addEdge(edge: IDataEdge): void {
    if (edge.target === this.endNode.nodeID) {
      edge.data = {...edge.data, toEndNode: true};
    }
    this.edges[`${edge.source}@${edge.target}`] = edge;
    this.cleanData();
    this.changed = true;
  }

  removeEdge(edge: {source: string; target: string}): void {
    const id = `${edge.source}@${edge.target}`;
    delete this.edges[id];
    this.cleanData();
    this.changed = true;
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
    return {
      isDataTest: true,
      name,
      description,
      nodeID,
      nodes: Object.values(nodes).map((node) => node.getData()),
      edges: Object.values(edges)
    };
  }

  getRFNodesAndEdges(): {nodes: Node[]; edges: Edge[]} {
    return {
      nodes: Object.values(this.nodes).map((node) => node.getRFNode()),
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
      this.nodeID = params.nodeID;
      this.edges = params.edges.reduce((prev, current) => {
        prev[`${current.source}@${current.target}`] = {...current};
        return prev;
      }, {} as {[index: string]: IDataEdge});
      this.nodes = params.nodes.reduce((prev, current) => {
        const node = getFlowNode(current);
        if (isStartNode(node)) this.startNode = node;
        if (isEndNode(node)) this.endNode = node;
        prev[current.nodeID] = node;
        return prev;
      }, {} as {[index: string]: IFlowNode});
    }
    this.cleanData();
  }
}
