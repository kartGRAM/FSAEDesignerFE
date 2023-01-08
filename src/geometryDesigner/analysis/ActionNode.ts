import {IFlowNode, IDataFlowNode, FlowNode} from './FlowNode';

export interface IActionNode extends IFlowNode {
  action(): void;
}

export interface IDataActionNode extends IDataFlowNode {}

export abstract class ActionNode extends FlowNode implements IActionNode {
  abstract action(): void;
}
