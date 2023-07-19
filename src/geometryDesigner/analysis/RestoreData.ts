import {IDataFlowNode, IFlowNode} from './FlowNode';
import {StartNode, isDataStartNode} from './StartNode';
import {EndNode, isDataEndNode} from './EndNode';
import {CaseStartNode, isDataCaseStartNode} from './CaseStartNode';
import {CaseEndNode, isDataCaseEndNode} from './CaseEndNode';
import {SetterNode, isDataSetterNode} from './SetterNode';
import {SweepNode, isDataSweepNode} from './SweepNode';

export function getFlowNode(node: IDataFlowNode): IFlowNode {
  if (isDataStartNode(node)) return new StartNode(node);
  if (isDataEndNode(node)) return new EndNode(node);
  if (isDataCaseStartNode(node)) return new CaseStartNode(node);
  if (isDataCaseEndNode(node)) return new CaseEndNode(node);
  if (isDataSetterNode(node)) return new SetterNode(node);
  if (isDataSweepNode(node)) return new SweepNode(node);
  throw new Error('未実装のnode');
}