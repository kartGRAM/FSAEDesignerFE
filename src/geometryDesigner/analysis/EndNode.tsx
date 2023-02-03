/* eslint-disable class-methods-use-this */
import {setAssembled} from '@store/reducers/uiTempGeometryDesigner';
import store from '@store/store';
import {Node as IRFNode} from 'reactflow';
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
  action(): void {
    const {dispatch} = store;
    dispatch(setAssembled(true));
  }

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

  getData(): IDataEndNode {
    const data = super.getData();
    return {...data, className: this.className};
  }

  getRFNode(): IRFNode {
    const rfNode = super.getRFNode();
    return {
      ...rfNode,
      type: 'oval',
      data: {label: this.name, source: true, target: true}
    };
  }

  constructor(
    params: {name: string; position: {x: number; y: number}} | IDataEndNode
  ) {
    super(params);
    // eslint-disable-next-line no-empty
    if (isDataFlowNode(params) && isDataEndNode(params)) {
    }
  }

  clone(): IEndNode {
    return new EndNode({...this.getData(), nodeID: uuidv4()});
  }
}

export function isEndNode(node: IFlowNode): node is IEndNode {
  return node.className === className;
}

export function isDataEndNode(node: IDataFlowNode): node is IDataEndNode {
  return node.className === className;
}
