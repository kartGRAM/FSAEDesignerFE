import {KinematicSolver} from '@gd/kinematics/Solver';
import {IFlowNode, IDataFlowNode, FlowNode} from './FlowNode';
import {ISnapshot} from '../kinematics/ISnapshot';

export interface IActionNode extends IFlowNode {
  // cancelの場合trueを返す
  action(solver: KinematicSolver): void;
  // restore(solver: KinematicSolver): void;
}

export interface IDataActionNode extends IDataFlowNode {}

export abstract class ActionNode extends FlowNode implements IActionNode {
  abstract action(solver: KinematicSolver): void;

  protected lastState: ISnapshot | undefined;
}

export function isActionNode(node: IFlowNode): node is ActionNode {
  return 'action' in node;
}
