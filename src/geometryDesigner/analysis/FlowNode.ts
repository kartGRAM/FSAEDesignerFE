import {Node as IRFNode, XYPosition} from 'reactflow';
import {v4 as uuidv4} from 'uuid';
import {isObject} from '@app/utils/helpers';
import {ITest} from './ITest';

type TargetNodeID = string;
type SourceNodeID = string;

export const endNodeClassName = 'End' as const;
export const caseEndNodeClassName = 'CaseEnd' as const;
export const caseStartNodeClassName = 'CaseStart' as const;

export interface IFlowNode {
  isFlowNode: true;
  readonly copyFrom?: string;
  setCopyFrom?: (node: IFlowNode | null) => void;
  nodeID: string;
  readonly className: string;
  selected: boolean;
  name: string;
  isInitialState: boolean;
  position: {x: number; y: number};
  extraFlags: any;
  getData(nodes: {[index: string]: IFlowNode | undefined}): IDataFlowNode;
  getRFNode(parentTest?: ITest, canvasUpdate?: () => void): IRFNode;
  acceptable(
    other: IFlowNode,
    nodes: {[index: string]: IFlowNode | undefined},
    edgesFromTarget: {[index: TargetNodeID]: IDataEdge | undefined},
    edgesFromSource: {[index: SourceNodeID]: IDataEdge[]}
  ): boolean;
  clone(nodes: {[index: string]: IFlowNode | undefined}): IFlowNode;
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

  isInitialState: boolean;

  private _name: string = '';

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
    this.isInitialState = false;
  }

  position: {x: number; y: number};

  constructor(
    params:
      | {name: string; position: {x: number; y: number}; nodeID?: string}
      | IDataFlowNode
  ) {
    const {name, position} = params;
    this.name = name;
    this.position = position;

    this.isInitialState = true;
    if (params.nodeID) this.nodeID = params.nodeID;
    if (isDataFlowNode(params)) {
      this.isInitialState = params.isInitialState;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getData(nodes: {[index: string]: IFlowNode | undefined}): IDataFlowNode {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getRFNode(parentTest?: ITest, canvasUpdate?: () => void): IRFNode {
    const {position, selected} = this;
    return {id: this.nodeID, position, data: {label: this.name}, selected};
  }

  acceptable(
    other: IFlowNode,
    nodes: {[index: string]: IFlowNode | undefined},
    edgesFromTarget: {[index: TargetNodeID]: IDataEdge | undefined},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    edgesFromSource: {[index: SourceNodeID]: IDataEdge[]}
  ): boolean {
    if (edgesFromTarget[this.nodeID] && this.className !== endNodeClassName)
      return false;
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

  abstract clone(nodes: {[index: string]: IFlowNode | undefined}): IFlowNode;

  extraFlags: any = {};
}

export const edgeClasses = ['default'] as const;
type EdgeClasses = typeof edgeClasses[number];
export interface IDataEdge {
  isDataEdge: true;
  readonly id: string;
  readonly className: EdgeClasses;
  data?: {
    toEndNode: boolean;
  };
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
