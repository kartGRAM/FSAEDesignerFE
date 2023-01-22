/* eslint-disable class-methods-use-this */
import * as React from 'react';
import {Node as IRFNode, XYPosition} from 'reactflow';
import Sweep from '@gdComponents/svgs/Sweep';
import {IFlowNode, isDataFlowNode, IDataFlowNode, Item} from './FlowNode';
import {IActionNode, IDataActionNode, ActionNode} from './ActionNode';
import {
  isStartNode,
  isAssemblyControlNode,
  isCaseControlNode
} from './TypeGuards';

const className = 'Sweep' as const;
type ClassName = typeof className;

export interface ISweepNode extends IActionNode {
  className: ClassName;
}

export interface IDataSweepNode extends IDataActionNode {
  className: ClassName;
}

export class SweepNode extends ActionNode implements ISweepNode {
  action(): void {}

  readonly className = className;

  acceptable(node: IFlowNode): boolean {
    if (!super.acceptable(node)) return false;
    if (
      isStartNode(node) ||
      isAssemblyControlNode(node) ||
      isCaseControlNode(node)
    )
      return true;
    return false;
  }

  getData(): IDataSweepNode {
    const data = super.getData();
    return {...data, className: this.className};
  }

  getRFNode(): IRFNode {
    const rfNode = super.getRFNode();
    return {...rfNode, data: {label: this.name}};
  }

  static getItem(): Item {
    return {
      className,
      icon: <Sweep title="Sweeper" />,
      text: 'Sweep parameters',
      onDrop: (position: XYPosition, temporary: boolean) =>
        new SweepNode({
          name: 'Parameter sweep',
          position,
          nodeID: temporary ? 'temp' : undefined
        })
    };
  }

  constructor(
    params:
      | {name: string; position: {x: number; y: number}; nodeID?: string}
      | IDataSweepNode
  ) {
    super(params);
    // eslint-disable-next-line no-empty
    if (isDataFlowNode(params) && isDataSweepNode(params)) {
    }
  }
}

export function isSweepNode(node: IFlowNode): node is ISweepNode {
  return node.className === className;
}

export function isDataSweepNode(node: IDataFlowNode): node is IDataSweepNode {
  return node.className === className;
}
