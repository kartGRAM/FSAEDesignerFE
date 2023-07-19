import {IFlowNode} from './FlowNode';
import {ISetterNode, isSetterNode} from './SetterNode';
import {ISweepNode, isSweepNode} from './SweepNode';
import {isStartNode} from './StartNode';
import {isEndNode} from './EndNode';
import {ICaseStartNode, isCaseStartNode} from './CaseStartNode';
import {ICaseEndNode, isCaseEndNode} from './CaseEndNode';
import {IChartNode, isChartNode} from './ChartNode';

export function isAssemblyControlNode(
  node: IFlowNode
): node is ISetterNode | ISweepNode {
  return isSetterNode(node) || isSweepNode(node);
}

export function isCaseControlNode(
  node: IFlowNode
): node is ICaseStartNode | ICaseEndNode {
  return isCaseStartNode(node) || isCaseEndNode(node);
}

export function isAfterEndNode(node: IFlowNode): node is IChartNode {
  return isChartNode(node);
}

export {
  isStartNode,
  isEndNode,
  isCaseStartNode,
  isCaseEndNode,
  isSetterNode,
  isSweepNode,
  isChartNode
};
