import {Node as IRFNode, Edge as IRFEdge} from 'reactFlow';
import {isObject} from '@app/utils/helpers';
import {IDataFlowNode, IDataEdge, IFlowNode} from './FlowNode';

export interface ITest {
  name: string;
  readonly nodeID: string;
  getData(): IDataTest;
  getRFNodesAndEdges(): {nodes: IRFNode[]; edges: IRFEdge[]};
  nodes: IFlowNode[];
  edges: IDataEdge[];
}

export interface IDataTest {
  readonly isDataTest: true;
  readonly nodeID: string;
  readonly name: string;
  readonly nodes: IDataFlowNode[];
  readonly edges: IDataEdge[];
}

export function isDataTest(edge: any): edge is IDataTest {
  return isObject(edge) && edge.isDataTest;
}
