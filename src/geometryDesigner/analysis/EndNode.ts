import {v4 as uuidv4} from 'uuid';
import {IActionNode, IDataActionNode, ActionNode} from './ActionNode';
import {
  isDataFlowNode,
  IFlowNode,
  IDataFlowNode,
  IDataEdge,
  endNodeClassName
} from './FlowNode';
import {isCaseEndNode} from './TypeGuards';

export const className = endNodeClassName;
type ClassName = typeof className;

export interface IEndNode extends IActionNode {
  className: ClassName;
}

export interface IDataEndNode extends IDataActionNode {
  className: ClassName;
}

export class EndNode extends ActionNode implements IEndNode {
  // eslint-disable-next-line class-methods-use-this
  action(): void {}

  readonly className = className;

  acceptable(
    node: IFlowNode,
    nodes: {[index: string]: IFlowNode | undefined},
    edges: {[index: string]: IDataEdge | undefined},
    edgesFromSource: {[index: string]: IDataEdge[]}
  ): boolean {
    if (!super.acceptable(node, nodes, edges, edgesFromSource)) return false;
    if (isCaseEndNode(node)) return true;
    return false;
  }

  validate(
    edgesFromTarget: {[index: string]: IDataEdge | undefined},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    edgesFromSource: {[index: string]: IDataEdge[]}
  ): boolean {
    if (edgesFromTarget[this.nodeID]) return true;
    return false;
  }

  getData(nodes: {[index: string]: IFlowNode | undefined}): IDataEndNode {
    const data = super.getData(nodes);
    return {...data, className: this.className};
  }

  constructor(
    params: {name: string; position: {x: number; y: number}} | IDataEndNode
  ) {
    super(params);
    // eslint-disable-next-line no-empty
    if (isDataFlowNode(params) && isDataEndNode(params)) {
    }
  }

  clone(nodes: {[index: string]: IFlowNode | undefined}): IEndNode {
    return new EndNode({...this.getData(nodes), nodeID: uuidv4()});
  }
}

export function isEndNode(node: IFlowNode): node is IEndNode {
  return node.className === className;
}

export function isDataEndNode(node: IDataFlowNode): node is IDataEndNode {
  return node.className === className;
}
