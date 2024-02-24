import {v4 as uuidv4} from 'uuid';
import {ISolver} from '@gd/kinematics/ISolver';
import {IActionNode, IDataActionNode, ActionNode} from './ActionNode';
import {isDataFlowNode, IFlowNode, IDataFlowNode, IDataEdge} from './FlowNode';

export const className = 'Start' as const;
type ClassName = typeof className;

export interface IStartNode extends IActionNode {
  className: ClassName;
}

export interface IDataStartNode extends IDataActionNode {
  className: ClassName;
}

export class StartNode extends ActionNode implements IStartNode {
  // eslint-disable-next-line class-methods-use-this
  action(solver: ISolver): void {
    solver.restoreInitialQ();
  }

  readonly className = className;

  // eslint-disable-next-line class-methods-use-this
  acceptable(): boolean {
    return false;
  }

  validate(
    edgesFromTarget: {[index: string]: IDataEdge | undefined},
    edgesFromSource: {[index: string]: IDataEdge[]}
  ): boolean {
    if (edgesFromSource[this.nodeID]?.length > 0) return true;
    return false;
  }

  getData(nodes: {[index: string]: IFlowNode | undefined}): IDataStartNode {
    const data = super.getData(nodes);
    return {...data, className: this.className};
  }

  constructor(
    params: {name: string; position: {x: number; y: number}} | IDataStartNode
  ) {
    super(params);
    // eslint-disable-next-line no-empty
    if (isDataFlowNode(params) && isDataStartNode(params)) {
    }
  }

  clone(nodes: {[index: string]: IFlowNode | undefined}): IStartNode {
    return new StartNode({...this.getData(nodes), nodeID: uuidv4()});
  }
}

export function isStartNode(node: IFlowNode): node is IStartNode {
  return node.className === className;
}

export function isDataStartNode(node: IDataFlowNode): node is IDataStartNode {
  return node.className === className;
}
