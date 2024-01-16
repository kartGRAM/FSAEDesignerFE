import {KinematicsSolver} from '@gd/kinematics/KinematicsSolver';
import {ISnapshot} from '@gd/analysis/ISnapshot';
import {IFlowNode, IDataFlowNode, FlowNode} from './FlowNode';

export interface IActionNode extends IFlowNode {
  action(
    solver: KinematicsSolver,
    getSnapshot: (solver: KinematicsSolver) => Required<ISnapshot>,
    ss?: Required<ISnapshot>[]
  ): void;
}

export interface IDataActionNode extends IDataFlowNode {}

export abstract class ActionNode extends FlowNode implements IActionNode {
  abstract action(
    solver: KinematicsSolver,
    getSnapshot: (solver: KinematicsSolver) => Required<ISnapshot>,
    ss?: Required<ISnapshot>[]
  ): void;
}

export function isActionNode(node: IFlowNode): node is IActionNode {
  return 'action' in node;
}
