/* eslint-disable class-methods-use-this */
import * as React from 'react';
import {Node as IRFNode, XYPosition} from 'reactflow';
import CaseEnd from '@gdComponents/svgs/CaseEnd';
import {v4 as uuidv4} from 'uuid';
import {
  IFlowNode,
  isDataFlowNode,
  IDataFlowNode,
  FlowNode,
  Item,
  IDataEdge,
  caseEndNodeClassName
} from './FlowNode';
import {isAssemblyControlNode} from './TypeGuards';
import {ITest} from './ITest';

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

  getRFNode(test?: ITest): IRFNode {
    const rfNode = super.getRFNode(test);
    return {
      ...rfNode,
      type: 'circle',
      data: {
        label: this.name,
        icon: <CaseEnd title={this.name} />
      }
    };
  }

  static getItem(): Item {
    return {
      className,
      icon: <CaseEnd title="Case End" />,
      text: 'Case end',
      onDrop: (position: XYPosition, temporary: boolean) =>
        new CaseEndNode({
          name: 'Case end',
          position,
          nodeID: temporary ? 'temp' : undefined
        })
    };
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
