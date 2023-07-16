import {v4 as uuidv4} from 'uuid';
import {
  IFlowNode,
  isDataFlowNode,
  IDataFlowNode,
  FlowNode,
  IDataEdge,
  caseStartNodeClassName
} from './FlowNode';
import {isStartNode, isCaseEndNode, isAssemblyControlNode} from './TypeGuards';

export const className = caseStartNodeClassName;
type ClassName = typeof className;

export interface ICaseStartNode extends IFlowNode {
  className: ClassName;
}

export interface IDataCaseStartNode extends IDataFlowNode {
  className: ClassName;
}

export class CaseStartNode extends FlowNode implements ICaseStartNode {
  readonly className = className;

  acceptable(
    node: IFlowNode,
    nodes: {[index: string]: IFlowNode | undefined},
    edges: {[index: string]: IDataEdge | undefined},
    edgesFromSource: {[index: string]: IDataEdge[]}
  ): boolean {
    if (!super.acceptable(node, nodes, edges, edgesFromSource)) return false;
    if (isCaseEndNode(node)) return true;
    if (isStartNode(node) || isCaseEndNode(node) || isAssemblyControlNode(node))
      return true;
    return false;
  }

  validate(
    edgesFromTarget: {[index: string]: IDataEdge | undefined},
    edgesFromSource: {[index: string]: IDataEdge[]}
  ): boolean {
    if (
      edgesFromSource[this.nodeID]?.length === 1 &&
      edgesFromTarget[this.nodeID]
    )
      return true;
    return false;
  }

  getData(nodes: {[index: string]: IFlowNode | undefined}): IDataCaseStartNode {
    const data = super.getData(nodes);
    return {...data, className: this.className};
  }

  constructor(
    params:
      | {name: string; position: {x: number; y: number}; nodeID?: string}
      | IDataCaseStartNode
  ) {
    super(params);
    // eslint-disable-next-line no-empty
    if (isDataFlowNode(params) && isDataCaseStartNode(params)) {
    }
  }

  clone(nodes: {[index: string]: IFlowNode | undefined}): ICaseStartNode {
    return new CaseStartNode({...this.getData(nodes), nodeID: uuidv4()});
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
