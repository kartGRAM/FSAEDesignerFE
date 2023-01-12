/* eslint-disable class-methods-use-this */
import {Node as IRFNode} from 'reactflow';
import {IFlowNode, isDataFlowNode, IDataFlowNode, FlowNode} from './FlowNode';
import {isStartNode, isCaseEndNode, isAssemblyControlNode} from './TypeGuards';

const className = 'CaseStart' as const;
type ClassName = typeof className;

export interface ICaseStartNode extends IFlowNode {
  className: ClassName;
}

export interface IDataCaseStartNode extends IDataFlowNode {
  className: ClassName;
}

export class CaseStartNode extends FlowNode implements ICaseStartNode {
  readonly className = className;

  acceptable(node: IFlowNode): boolean {
    if (isStartNode(node) || isCaseEndNode(node) || isAssemblyControlNode(node))
      return true;
    return false;
  }

  getData(): IDataCaseStartNode {
    const data = super.getData();
    return {...data, className: this.className};
  }

  getRFNode(): IRFNode {
    const rfNode = super.getRFNode();
    return {...rfNode, data: this.name};
  }

  constructor(
    params:
      | {name: string; position: {x: number; y: number}}
      | IDataCaseStartNode
  ) {
    super(params);
    // eslint-disable-next-line no-empty
    if (isDataFlowNode(params) && isDataCaseStartNode(params)) {
    }
  }
}

export function isCaseStartNode(node: IFlowNode): node is ICaseStartNode {
  return node.className === className;
}

export function isDataCaseStartNode(
  node: IDataFlowNode
): node is IDataCaseStartNode {
  return node.className === className;
}
