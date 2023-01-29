/* eslint-disable class-methods-use-this */
import * as React from 'react';
import {Node as IRFNode, XYPosition} from 'reactflow';
import CaseStart from '@gdComponents/svgs/CaseStart';
import {
  IFlowNode,
  isDataFlowNode,
  IDataFlowNode,
  FlowNode,
  Item,
  IDataEdge
} from './FlowNode';
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

  acceptable(
    node: IFlowNode,
    nodes: {[index: string]: IFlowNode | undefined},
    edges: {[index: string]: IDataEdge | undefined}
  ): boolean {
    if (!super.acceptable(node, nodes, edges)) return false;
    // CaseStartが上流にある場合はNG
    if (isCaseEndNode(node)) return true;
    let parent = edges[node.nodeID];
    while (parent) {
      const parentNode = nodes[parent.source];
      if (parentNode && isCaseEndNode(parentNode)) break;
      if (parentNode && isCaseStartNode(parentNode)) return false;
      parent = edges[parent.source];
    }

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
    return {
      ...rfNode,
      type: 'circle',
      data: {
        label: this.name,
        icon: <CaseStart title={this.name} />
      }
    };
  }

  static getItem(): Item {
    return {
      className,
      icon: <CaseStart title="Case Start" />,
      text: 'Case start',
      onDrop: (position: XYPosition, temporary: boolean) =>
        new CaseStartNode({
          name: 'Case start',
          position,
          nodeID: temporary ? 'temp' : undefined
        })
    };
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
}

export function isCaseStartNode(node: IFlowNode): node is ICaseStartNode {
  return node.className === className;
}

export function isDataCaseStartNode(
  node: IDataFlowNode
): node is IDataCaseStartNode {
  return node.className === className;
}
