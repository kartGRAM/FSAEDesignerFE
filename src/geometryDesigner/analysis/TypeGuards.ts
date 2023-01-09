import {IFlowNode} from './FlowNode';
import {ISetterNode, isSetterNode} from './SetterNode';
import {ISweepNode, isSweepNode} from './SweepNode';
import {isStartNode} from './StartNode';
import {ICaseStartNode, isCaseStartNode} from './CaseStartNode';
import {ICaseEndNode, isCaseEndNode} from './CaseEndNode';

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

export {isStartNode, isCaseStartNode, isCaseEndNode, isSetterNode, isSweepNode};
