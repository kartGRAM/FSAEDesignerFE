import {Node, Edge} from 'reactflow';
import {v4 as uuidv4} from 'uuid';
import {IFlowNode, IDataEdge} from './FlowNode';
import {StartNode} from './StartNode';
import {EndNode} from './EndNode';
import {ITest, IDataTest, isDataTest} from './ITest';
import {getEdge, getFlowNode} from './RestoreData';

export class Test implements ITest {
  name: string;

  description: string;

  nodeID: string = uuidv4();

  done = false;

  ready = false;

  getData(): IDataTest {
    const {name, description, nodeID, edges, nodes} = this;
    return {
      isDataTest: true,
      name,
      description,
      nodeID,
      nodes: nodes.map((node) => node.getData()),
      edges: [...edges]
    };
  }

  getRFNodesAndEdges(): {nodes: Node[]; edges: Edge[]} {
    return {
      nodes: this.nodes.map((node) => node.getRFNode()),
      edges: this.edges.map((edge) => getEdge(edge))
    };
  }

  nodes: IFlowNode[];

  edges: IDataEdge[] = [];

  constructor(params: {name: string; description: string} | IDataTest) {
    this.name = params.name;
    this.description = params.description;
    this.nodes = [
      new StartNode({name: 'assemble & start test', position: {x: 0, y: 0}}),
      new EndNode({name: 'test end', position: {x: 1000, y: 0}})
    ];
    if (isDataTest(params)) {
      this.nodeID = params.nodeID;
      this.edges = [...params.edges];
      this.nodes = params.nodes.map((node) => getFlowNode(node));
    }
  }
}
