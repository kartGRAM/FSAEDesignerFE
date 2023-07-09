import {IFlowNode, IDataFlowNode, FlowNode} from './FlowNode';

export interface IActionNode extends IFlowNode {
  action(): void;
}

export interface IDataActionNode extends IDataFlowNode {}

export abstract class ActionNode extends FlowNode implements IActionNode {
  abstract action(): Promise<void>;
}

export function isActionNode(node: IFlowNode): node is ActionNode {
  return 'action' in node;
}
