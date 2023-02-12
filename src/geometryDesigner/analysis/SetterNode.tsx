/* eslint-disable class-methods-use-this */
import * as React from 'react';
import {Node as IRFNode, XYPosition} from 'reactflow';
import Tuning from '@gdComponents/svgs/Tuning';
import {v4 as uuidv4} from 'uuid';
import FlowNodeDialog from '@gdComponents/side-panel-components/analysis/FlowNodeDialog';
import {CardNodeProps} from '@gdComponents/side-panel-components/analysis/CardNode';
import {
  IFlowNode,
  isDataFlowNode,
  IDataFlowNode,
  Item,
  IDataEdge
} from './FlowNode';
import {IActionNode, IDataActionNode, ActionNode} from './ActionNode';
import {
  isStartNode,
  isAssemblyControlNode,
  isCaseControlNode
} from './TypeGuards';
import {ITest} from './ITest';

const className = 'Setter' as const;
type ClassName = typeof className;

export interface ISetterNode extends IActionNode {
  className: ClassName;
}

export interface IDataSetterNode extends IDataActionNode {
  className: ClassName;
}

export class SetterNode extends ActionNode implements ISetterNode {
  action(): void {}

  readonly className = className;

  acceptable(
    node: IFlowNode,
    nodes: {[index: string]: IFlowNode | undefined},
    edges: {[index: string]: IDataEdge | undefined},
    edgesFromSource: {[index: string]: IDataEdge[]}
  ): boolean {
    if (!super.acceptable(node, nodes, edges, edgesFromSource)) return false;
    if (
      isStartNode(node) ||
      isAssemblyControlNode(node) ||
      isCaseControlNode(node)
    )
      return true;
    return false;
  }

  getData(): IDataSetterNode {
    const data = super.getData();
    return {...data, className: this.className};
  }

  getRFNode(test: ITest, canvasUpdate?: () => void): IRFNode & CardNodeProps {
    const rfNode = super.getRFNode(test, canvasUpdate);
    return {
      ...rfNode,
      type: 'card',
      data: {
        label: this.name,
        source: true,
        target: true,
        useDialog: () => useSetterDialog({node: this, test, canvasUpdate})
      }
    };
  }

  static getItem(): Item {
    return {
      className,
      icon: <Tuning title="Setter" />,
      text: 'Set parameters',
      onDrop: (position: XYPosition, temporary: boolean) =>
        new SetterNode({
          name: 'Parameter setting',
          position,
          nodeID: temporary ? 'temp' : undefined
        })
    };
  }

  constructor(
    params:
      | {name: string; position: {x: number; y: number}; nodeID?: string}
      | IDataSetterNode
  ) {
    super(params);
    // eslint-disable-next-line no-empty
    if (isDataFlowNode(params) && isDataSetterNode(params)) {
    }
  }

  clone(): ISetterNode {
    return new SetterNode({...this.getData(), nodeID: uuidv4()});
  }
}

export function isSetterNode(node: IFlowNode): node is ISetterNode {
  return node.className === className;
}

export function isDataSetterNode(node: IDataFlowNode): node is IDataSetterNode {
  return node.className === className;
}

function useSetterDialog(props: {
  node: SetterNode;
  test?: ITest;
  canvasUpdate?: () => void;
}): [JSX.Element | null, React.Dispatch<React.SetStateAction<boolean>>] {
  const {node, test, canvasUpdate} = props;
  const [open, setOpen] = React.useState(false);

  const handleClose = async () => {
    setOpen(false);
    if (canvasUpdate) canvasUpdate();
  };

  return [
    test ? (
      <FlowNodeDialog
        key={node.nodeID}
        node={node}
        test={test}
        open={open}
        onClose={handleClose}
        paperProps={{}}
      >
        <span>content</span>
      </FlowNodeDialog>
    ) : null,
    setOpen
  ];
}
