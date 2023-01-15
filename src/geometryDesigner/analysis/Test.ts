import {Node, Edge} from 'reactflow';
import {v4 as uuidv4} from 'uuid';
import store from '@store/store';
import {setTests} from '@store/reducers/dataGeometryDesigner';
import {IFlowNode, IDataEdge} from './FlowNode';
import {StartNode} from './StartNode';
import {EndNode} from './EndNode';
import {ITest, IDataTest, isDataTest} from './ITest';
import {getEdge, getFlowNode} from './RestoreData';

export class Test implements ITest {
  name: string;

  description: string;

  nodeID: string = uuidv4();

  changed = false;

  done = false;

  ready = false;

  addNode(node: IFlowNode): void {
    this.nodes[node.nodeID] = node;
    this.changed = true;
  }

  removeNode(node: IFlowNode): void {
    delete this.nodes[node.nodeID];
    this.changed = true;
  }

  addEdge(edge: IDataEdge): void {
    this.edges[`${edge.source}@${edge.target}`] = edge;
    this.changed = true;
  }

  removeEdge(edge: IDataEdge): void {
    delete this.edges[`${edge.source}@${edge.target}`];
  }

  getData(): IDataTest {
    const {name, description, nodeID, edges, nodes} = this;
    return {
      isDataTest: true,
      name,
      description,
      nodeID,
      nodes: Object.values(nodes).map((node) => node.getData()),
      edges: [...Object.values(edges)]
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

  constructor(params: {name: string; description: string} | IDataTest) {
    this.name = params.name;
    this.description = params.description;
    this.nodes = [
      new StartNode({name: 'assemble & start test', position: {x: 0, y: 0}}),
      new EndNode({name: 'test end', position: {x: 1000, y: 0}})
    ].reduce((prev, current) => {
      prev[current.nodeID] = current;
      return prev;
    }, {} as {[index: string]: IFlowNode});
    if (isDataTest(params)) {
      this.nodeID = params.nodeID;
      this.edges = params.edges.reduce((prev, current) => {
        prev[`${current.source}@${current.target}`] = current;
        return prev;
      }, {} as {[index: string]: IDataEdge});
      this.nodes = params.nodes.reduce((prev, current) => {
        prev[current.nodeID] = getFlowNode(current);
        return prev;
      }, {} as {[index: string]: IFlowNode});
    }
  }
}
