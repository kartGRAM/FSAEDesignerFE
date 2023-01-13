/* eslint-disable class-methods-use-this */
import {Node as IRFNode} from 'reactflow';
import {IFlowNode, isDataFlowNode, IDataFlowNode, FlowNode} from './FlowNode';
import {isAssemblyControlNode} from './TypeGuards';

const className = 'CaseEnd' as const;
type ClassName = typeof className;

export interface ICaseEndNode extends IFlowNode {
  className: ClassName;
}

export interface IDataCaseEndNode extends IDataFlowNode {
  className: ClassName;
}

export class CaseEndNode extends FlowNode implements ICaseEndNode {
  readonly className = className;

  acceptable(node: IFlowNode): boolean {
    if (isAssemblyControlNode(node)) return true;
    return false;
  }

  getData(): IDataCaseEndNode {
    const data = super.getData();
    return {...data, className: this.className};
  }

  getRFNode(): IRFNode {
    const rfNode = super.getRFNode();
    return {...rfNode, data: {label: this.name}};
  }

  constructor(
    params: {name: string; position: {x: number; y: number}} | IDataCaseEndNode
  ) {
    super(params);
    // eslint-disable-next-line no-empty
    if (isDataFlowNode(params) && isDataCaseEndNode(params)) {
    }
  }
}

export function isCaseEndNode(node: IFlowNode): node is ICaseEndNode {
  return node.className === className;
}

export function isDataCaseEndNode(
  node: IDataFlowNode
): node is IDataCaseEndNode {
  return node.className === className;
}