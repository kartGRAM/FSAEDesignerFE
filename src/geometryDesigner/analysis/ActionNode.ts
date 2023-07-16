import {KinematicSolver} from '@gd/kinematics/Solver';
import {ISnapshot} from '@gd/kinematics/ISnapshot';
import {IFlowNode, IDataFlowNode, FlowNode} from './FlowNode';

export interface IActionNode extends IFlowNode {
  action(solver: KinematicSolver, ss?: ISnapshot[]): void;
}

export interface IDataActionNode extends IDataFlowNode {}

export abstract class ActionNode extends FlowNode implements IActionNode {
  abstract action(solver: KinematicSolver, ss?: ISnapshot[]): void;
}

export function isActionNode(node: IFlowNode): node is IActionNode {
  return 'action' in node;
}
