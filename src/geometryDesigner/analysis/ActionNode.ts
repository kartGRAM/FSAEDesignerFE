import {IFlowNode, IDataFlowNode, FlowNode} from './FlowNode';
import {ISnapshot} from '../kinematics/ISnapshot';

export interface IActionNode extends IFlowNode {
  // cancelの場合trueを返す
  action(cancel: () => Promise<boolean>): Promise<boolean>;
  restore(cancel: () => Promise<boolean>): Promise<boolean>;
}

export interface IDataActionNode extends IDataFlowNode {}

export abstract class ActionNode extends FlowNode implements IActionNode {
  abstract action(cancel: () => Promise<boolean>): Promise<boolean>;

  protected lastState: ISnapshot | undefined;

  abstract restore(cancel: () => Promise<boolean>): Promise<boolean>;
}

export function isActionNode(node: IFlowNode): node is ActionNode {
  return 'action' in node;
}
