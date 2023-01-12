/* eslint-disable class-methods-use-this */
import {Node as IRFNode} from 'reactflow';
import {IFlowNode, isDataFlowNode, IDataFlowNode} from './FlowNode';
import {IActionNode, IDataActionNode, ActionNode} from './ActionNode';
import {
  isStartNode,
  isAssemblyControlNode,
  isCaseControlNode
} from './TypeGuards';

const className = 'Sweep' as const;
type ClassName = typeof className;

export interface ISetterNode extends IActionNode {
  className: ClassName;
}

export interface IDataSetterNode extends IDataActionNode {
  className: ClassName;
}

export class SetterNode extends ActionNode implements ISetterNode {
  action(): void {}

  readonly className = className;

  acceptable(node: IFlowNode): boolean {
    if (
      isStartNode(node) ||
      isAssemblyControlNode(node) ||
      isCaseControlNode(node)
    )
      return true;
    return false;
  }

  getData(): IDataSetterNode {
    const data = super.getData();
    return {...data, className: this.className};
  }

  getRFNode(): IRFNode {
    const rfNode = super.getRFNode();
    return {...rfNode, data: this.name};
  }

  constructor(
    params: {name: string; position: {x: number; y: number}} | IDataSetterNode
  ) {
    super(params);
    // eslint-disable-next-line no-empty
    if (isDataFlowNode(params) && isDataSetterNode(params)) {
    }
  }
}

export function isSetterNode(node: IFlowNode): node is ISetterNode {
  return node.className === className;
}

export function isDataSetterNode(node: IDataFlowNode): node is IDataSetterNode {
  return node.className === className;
}
