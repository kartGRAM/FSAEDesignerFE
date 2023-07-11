import {IFlowNode, IDataFlowNode, FlowNode} from './FlowNode';
import {ISnapshot} from '../kinematics/ISnapshot';

export interface IActionNode extends IFlowNode {
  action(cancel: () => Promise<boolean>): Promise<void>;
  restore(cancel: () => Promise<boolean>): Promise<void>;
}

export interface IDataActionNode extends IDataFlowNode {}

export abstract class ActionNode extends FlowNode implements IActionNode {
  abstract action(cancel: () => Promise<boolean>): Promise<void>;

  protected lastState: ISnapshot | undefined;

  abstract restore(cancel: () => Promise<boolean>): Promise<void>;
}

export function isActionNode(node: IFlowNode): node is ActionNode {
  return 'action' in node;
}
