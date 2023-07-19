import {KinematicSolver} from '@gd/kinematics/Solver';
import {MeasureSnapshot, ISnapshot} from '@gd/kinematics/ISnapshot';
import {IFlowNode, IDataFlowNode, FlowNode} from './FlowNode';

export interface IActionNode extends IFlowNode {
  action(
    solver: KinematicSolver,
    getMeasureSnapshot: () => MeasureSnapshot,
    ss?: ISnapshot[]
  ): void;
}

export interface IDataActionNode extends IDataFlowNode {}

export abstract class ActionNode extends FlowNode implements IActionNode {
  abstract action(
    solver: KinematicSolver,
    getMeasureSnapshot: () => MeasureSnapshot,
    ss?: Required<ISnapshot>[]
  ): void;
}

export function isActionNode(node: IFlowNode): node is IActionNode {
  return 'action' in node;
}
