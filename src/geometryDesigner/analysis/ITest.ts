import {Node as IRFNode, Edge as IRFEdge} from 'reactflow';
import {isObject} from '@app/utils/helpers';
import {IDataFlowNode, IDataEdge, IFlowNode} from './FlowNode';

export interface ITest {
  name: string;
  description: string;
  readonly done: boolean;
  readonly ready: boolean;
  readonly changed: boolean;
  readonly nodeID: string;
  addNode(node: IFlowNode): void;
  removeNode(node: IFlowNode): void;
  addEdge(edge: IDataEdge): void;
  removeEdge(edge: IDataEdge): void;
  getData(): IDataTest;
  getRFNodesAndEdges(): {nodes: IRFNode[]; edges: IRFEdge[]};
  dispatch(): void;
  readonly nodes: {[index: string]: IFlowNode};
  readonly edges: {[index: string]: IDataEdge};
}

export interface IDataTest {
  readonly isDataTest: true;
  readonly nodeID: string;
  readonly name: string;
  readonly description: string;
  readonly nodes: IDataFlowNode[];
  readonly edges: IDataEdge[];
}

export function isDataTest(edge: any): edge is IDataTest {
  return isObject(edge) && edge.isDataTest;
}
