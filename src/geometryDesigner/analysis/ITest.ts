import {Node as IRFNode, Edge as IRFEdge} from 'reactFlow';
import {IDataFlowNode, IDataEdge} from './FlowNode';

export interface ITest {
  name: string;
  readonly nodeID: string;
  getData(): IDataTest;
  getRFNodesAndEdges(): {nodes: IRFNode[]; edges: IRFEdge[]};
}

export interface IDataTest {
  readonly nodeID: string;
  readonly name: string;
  readonly nodes: IDataFlowNode[];
  readonly edges: IDataEdge[];
}
