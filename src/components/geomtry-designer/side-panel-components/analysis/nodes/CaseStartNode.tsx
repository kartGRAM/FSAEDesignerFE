import * as React from 'react';
import {CircleNodeProps} from '@gdComponents/side-panel-components/analysis/CircleNode';
import {Node as IRFNode} from 'reactflow';
import {ITest} from '@gd/analysis/ITest';
import {
  className,
  isCaseStartNode,
  ICaseStartNode,
  CaseStartNode
} from '@gd/analysis/CaseStartNode';
import {Item, XYPosition} from '@gd/analysis/FlowNode';
import CaseStart from '@gdComponents/svgs/CaseStart';
import FlowNodeDialog from '@gdComponents/side-panel-components/analysis/FlowNodeDialog';
import Typography from '@mui/material/Typography';
import {getRFNodeBase} from './Base';

export {isCaseStartNode};

export function getRFNode(
  node: ICaseStartNode,
  parentTest?: ITest,
  canvasUpdate?: () => void
): IRFNode & CircleNodeProps {
  const rfNode = getRFNodeBase(node, parentTest);
  return {
    ...rfNode,
    type: 'circle',
    data: {
      ...rfNode.data,
      icon: (
        <CaseStartIcon
          node={node}
          test={parentTest}
          canvasUpdate={canvasUpdate}
        />
      )
    }
  };
}

export function getItem(): Item {
  return {
    className,
    icon: <CaseStart title="Case Start" />,
    text: 'Case start',
    onDrop: (position: XYPosition, temporary: boolean, testID: string) =>
      new CaseStartNode(
        {
          name: 'Case start',
          position,
          nodeID: temporary ? 'temp' : undefined
        },
        testID
      )
  };
}

function CaseStartIcon(props: {
  node: ICaseStartNode;
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
      {test ? (
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
