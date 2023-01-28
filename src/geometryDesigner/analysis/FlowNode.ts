import {Node as IRFNode, XYPosition} from 'reactflow';
import {v4 as uuidv4} from 'uuid';
import {isObject} from '@app/utils/helpers';

type TargetNodeID = string;
export interface IFlowNode {
  isFlowNode: true;
  readonly nodeID: string;
  readonly className: string;
  selected: boolean;
  name: string;
  isInitialState: boolean;
  position: {x: number; y: number};
  getData(): IDataFlowNode;
  getRFNode(): IRFNode;
  acceptable(
    other: IFlowNode,
    nodes: {[index: string]: IFlowNode | undefined},
    edges: {[index: TargetNodeID]: IDataEdge | undefined}
  ): boolean;
  getSize(): {width: number; height: number};
}

export interface IDataFlowNode {
  isDataFlowNode: true;
  readonly nodeID: string;
  readonly className: string;
  name: string;
  isInitialState: boolean;
  position: {x: number; y: number};
}

export abstract class FlowNode implements IFlowNode {
  readonly isFlowNode = true as const;

  readonly nodeID: string = uuidv4();

  abstract readonly className: string;

  selected: boolean = false;

  isInitialState: boolean = true;

  name: string;

  position: {x: number; y: number};

  constructor(
    params:
      | {name: string; position: {x: number; y: number}; nodeID?: string}
      | IDataFlowNode
  ) {
    const {name, position} = params;
    this.name = name;
    this.position = position;
    if (params.nodeID) this.nodeID = params.nodeID;
    if (isDataFlowNode(params)) {
      this.isInitialState = params.isInitialState;
    }
  }

  getData(): IDataFlowNode {
    const {nodeID, name, isInitialState, position, className} = this;
    return {
      isDataFlowNode: true,
      className,
      nodeID,
      name,
      isInitialState,
      position
    };
  }

  getRFNode(): IRFNode {
    const {position, selected} = this;
    return {id: this.nodeID, position, data: {label: this.name}, selected};
  }

  acceptable(
    other: IFlowNode,
    nodes: {[index: string]: IFlowNode | undefined},
    edges: {[index: string]: IDataEdge | undefined}
  ): boolean {
    if (edges[this.nodeID] && this.className !== 'End') return false;
    if (other.nodeID === this.nodeID) return false;
    return true;
  }

  getSize(): {width: number; height: number} {
    const element = document.querySelectorAll(`[data-id="${this.nodeID}"]`)[0];
    if (!element) return {width: 0, height: 0};
    const width = element.scrollWidth;
    const height = element.scrollHeight;
    return {width, height};
  }
}

export const edgeClasses = ['default'] as const;
type EdgeClasses = typeof edgeClasses[number];
export interface IDataEdge {
  isDataEdge: true;
  readonly id: string;
  readonly className: EdgeClasses;
  source: string;
  target: string;
  selected: boolean;
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

export type Item = {
  className: string;

  icon: JSX.Element;

  text: string | JSX.Element;
  onDrop: (position: XYPosition, temporary: boolean) => IFlowNode;
};
