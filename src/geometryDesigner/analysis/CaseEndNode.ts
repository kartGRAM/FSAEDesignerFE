import {v4 as uuidv4} from 'uuid';
import {
  IFlowNode,
  isDataFlowNode,
  IDataFlowNode,
  FlowNode,
  IDataEdge,
  caseEndNodeClassName
} from './FlowNode';
import {isAssemblyControlNode} from './TypeGuards';

export const className = caseEndNodeClassName;
type ClassName = typeof className;

export interface ICaseEndNode extends IFlowNode {
  className: ClassName;
}

export interface IDataCaseEndNode extends IDataFlowNode {
  className: ClassName;
}

export class CaseEndNode extends FlowNode implements ICaseEndNode {
  readonly className = className;

  acceptable(
    node: IFlowNode,
    nodes: {[index: string]: IFlowNode | undefined},
    edges: {[index: string]: IDataEdge | undefined},
    edgesFromSource: {[index: string]: IDataEdge[]}
  ): boolean {
    if (!super.acceptable(node, nodes, edges, edgesFromSource)) return false;

    if (isAssemblyControlNode(node)) return true;
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

  getData(nodes: {[index: string]: IFlowNode | undefined}): IDataCaseEndNode {
    const data = super.getData(nodes);
    return {...data, className: this.className};
  }

  constructor(
    params:
      | {name: string; position: {x: number; y: number}; nodeID?: string}
      | IDataCaseEndNode
  ) {
    super(params);
    // eslint-disable-next-line no-empty
    if (isDataFlowNode(params) && isDataCaseEndNode(params)) {
    }
  }

  clone(nodes: {[index: string]: IFlowNode | undefined}): ICaseEndNode {
    return new CaseEndNode({...this.getData(nodes), nodeID: uuidv4()});
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
