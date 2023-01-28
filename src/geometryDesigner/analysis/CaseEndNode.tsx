/* eslint-disable class-methods-use-this */
import * as React from 'react';
import {Node as IRFNode, XYPosition} from 'reactflow';
import CaseEnd from '@gdComponents/svgs/CaseEnd';
import {
  IFlowNode,
  isDataFlowNode,
  IDataFlowNode,
  FlowNode,
  Item,
  IDataEdge
} from './FlowNode';
import {isAssemblyControlNode, isCaseStartNode} from './TypeGuards';

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

  acceptable(
    node: IFlowNode,
    nodes: {[index: string]: IFlowNode | undefined},
    edges: {[index: string]: IDataEdge | undefined}
  ): boolean {
    if (!super.acceptable(node, nodes, edges)) return false;
    // CaseStartが上流にない場合はNG
    let parent = edges[node.nodeID];
    while (parent) {
      const parentNode = nodes[parent.source];
      // 先にCaseEndNodeが見つかったらNG
      if (parentNode && isCaseEndNode(parentNode)) return false;
      if (parentNode && isCaseStartNode(parentNode)) break;
      parent = edges[parent.source];
      if (!parent) return false;
    }

    if (isAssemblyControlNode(node)) return true;
    return false;
  }

  getData(): IDataCaseEndNode {
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
}

export function isCaseEndNode(node: IFlowNode): node is ICaseEndNode {
  return node.className === className;
}

export function isDataCaseEndNode(
  node: IDataFlowNode
): node is IDataCaseEndNode {
  return node.className === className;
}
