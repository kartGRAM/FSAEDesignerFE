import {Node as IRFNode} from 'reactflow';
import {v4 as uuidv4} from 'uuid';
import {isObject} from '@app/utils/helpers';

export interface IFlowNode {
  isFlowNode: true;
  readonly nodeID: string;
  readonly className: string;
  name: string;
  position: {x: number; y: number};
  getData(): IDataFlowNode;
  getRFNode(): IRFNode;
  acceptable(other: IFlowNode): boolean;
}

export interface IDataFlowNode {
  isDataFlowNode: true;
  readonly nodeID: string;
  readonly className: string;
  name: string;
  position: {x: number; y: number};
}

export abstract class FlowNode implements IFlowNode {
  readonly isFlowNode = true as const;

  readonly nodeID: string = uuidv4();

  abstract readonly className: string;

  name: string;

  position: {x: number; y: number};

  constructor(
    params: {name: string; position: {x: number; y: number}} | IDataFlowNode
  ) {
    const {name, position} = params;
    this.name = name;
    this.position = position;
    if (isDataFlowNode(params)) {
      this.nodeID = params.nodeID;
    }
  }

  getData(): IDataFlowNode {
    const {nodeID, name, position, className} = this;
    return {
      isDataFlowNode: true,
      className,
      nodeID,
      name,
      position
    };
  }

  getRFNode(): IRFNode {
    const {position} = this;
    return {id: this.nodeID, position, data: {label: this.name}};
  }

  abstract acceptable(other: IFlowNode): boolean;
}

export const edgeClasses = ['default'] as const;
type EdgeClasses = typeof edgeClasses[number];
export interface IDataEdge {
  isDataEdge: true;
  readonly id: string;
  readonly className: EdgeClasses;
  source: string;
  target: string;
}

export function isFlowNode(node: any): node is IFlowNode {
  return isObject(node) && node.isFlowNode;
}

export function isDataFlowNode(node: any): node is IDataFlowNode {
  return isObject(node) && node.isDataFlowNode;
}

export function isDataEdge(edge: any): edge is IDataEdge {
  return isObject(edge) && edge.isDataEdge;
}