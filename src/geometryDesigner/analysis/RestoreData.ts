import {IDataFlowNode, IFlowNode} from './FlowNode';
import {StartNode, isDataStartNode} from './StartNode';
import {EndNode, isDataEndNode} from './EndNode';
import {CaseStartNode, isDataCaseStartNode} from './CaseStartNode';
import {CaseEndNode, isDataCaseEndNode} from './CaseEndNode';
import {SetterNode, isDataSetterNode} from './SetterNode';
import {SweepNode, isDataSweepNode} from './SweepNode';
import {ChartNode, isDataChartNode} from './ChartNode';

export function getFlowNode(
  node: IDataFlowNode,
  parentTestID: string
): IFlowNode {
  if (isDataStartNode(node)) return new StartNode(node, parentTestID);
  if (isDataEndNode(node)) return new EndNode(node, parentTestID);
  if (isDataCaseStartNode(node)) return new CaseStartNode(node, parentTestID);
  if (isDataCaseEndNode(node)) return new CaseEndNode(node, parentTestID);
  if (isDataSetterNode(node)) return new SetterNode(node, parentTestID);
  if (isDataSweepNode(node)) return new SweepNode(node, parentTestID);
  if (isDataChartNode(node)) return new ChartNode(node, parentTestID);
  throw new Error('未実装のnode');
}
