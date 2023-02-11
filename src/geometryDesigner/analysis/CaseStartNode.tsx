/* eslint-disable class-methods-use-this */
import * as React from 'react';
import {Node as IRFNode, XYPosition} from 'reactflow';
import CaseStart from '@gdComponents/svgs/CaseStart';
import {v4 as uuidv4} from 'uuid';
import FlowNodeDialog from '@gdComponents/side-panel-components/analysis/FlowNodeDialog';
import {Typography} from '@mui/material';
import {
  IFlowNode,
  isDataFlowNode,
  IDataFlowNode,
  FlowNode,
  Item,
  IDataEdge,
  caseStartNodeClassName
} from './FlowNode';
import {ITest} from './ITest';
import {isStartNode, isCaseEndNode, isAssemblyControlNode} from './TypeGuards';

export const className = caseStartNodeClassName;
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
    edges: {[index: string]: IDataEdge | undefined},
    edgesFromSource: {[index: string]: IDataEdge[]}
  ): boolean {
    if (!super.acceptable(node, nodes, edges, edgesFromSource)) return false;
    if (isCaseEndNode(node)) return true;
    if (isStartNode(node) || isCaseEndNode(node) || isAssemblyControlNode(node))
      return true;
    return false;
  }

  getData(): IDataCaseStartNode {
    const data = super.getData();
    return {...data, className: this.className};
  }

  getRFNode(parentTest?: ITest, canvasUpdate?: () => void): IRFNode {
    const rfNode = super.getRFNode(parentTest, canvasUpdate);
    return {
      ...rfNode,
      type: 'circle',
      data: {
        label: this.name,
        icon: (
          <CaseStartIcon
            node={this}
            test={parentTest}
            canvasUpdate={canvasUpdate}
          />
        )
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

  clone(): ICaseStartNode {
    return new CaseStartNode({...this.getData(), nodeID: uuidv4()});
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

function CaseStartIcon(props: {
  node: CaseStartNode;
  test?: ITest;
  canvasUpdate?: () => void;
}) {
  const {node, test, canvasUpdate} = props;
  const [open, setOpen] = React.useState(false);

  const handleClose = async () => {
    setOpen(false);
    if (canvasUpdate) canvasUpdate();
  };

  return (
    <>
      <CaseStart title={node.name} onDoubleClick={() => setOpen(true)} />
      {test && open ? (
        <FlowNodeDialog
          key={node.nodeID}
          node={node}
          test={test}
          open={open}
          onClose={handleClose}
          paperProps={{}}
        >
          <Typography variant="body2">
            Only node name change is possible.
          </Typography>
        </FlowNodeDialog>
      ) : null}
    </>
  );
}
