import {Node, Edge} from 'reactFlow';
import {v4 as uuidv4} from 'uuid';
import {IFlowNode, IDataEdge} from './FlowNode';
import {ITest, IDataTest, isDataTest} from './ITest';
import {getEdge, getFlowNode} from './RestoreData';

class Test implements ITest {
  name: string;

  nodeID: string = uuidv4();

  getData(): IDataTest {
    const {name, nodeID, edges, nodes} = this;
    return {
      isDataTest: true,
      name,
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

  nodes: IFlowNode[] = [];

  edges: IDataEdge[] = [];

  constructor(params: {name: string} | IDataTest) {
    this.name = params.name;
    if (isDataTest(params)) {
      this.nodeID = params.nodeID;
      this.edges = [...params.edges];
      this.nodes =
    }
  }
}
