import * as React from 'react';
import {CardNodeProps} from '@gdComponents/side-panel-components/analysis/CardNode';
import {Node as IRFNode} from 'reactflow';
import {ITest} from '@gd/analysis/ITest';
import {
  className,
  IChartNode,
  ChartNode,
  isChartNode
} from '@gd/analysis/ChartNode';
import {Item, XYPosition} from '@gd/analysis/FlowNode';
import FlowNodeDialog from '@gdComponents/side-panel-components/analysis/FlowNodeDialog';
import Box from '@mui/material/Box';

import TimelineIcon from '@mui/icons-material/Timeline';
import {getRFNodeBase} from './Base';

export {isChartNode};

export function getRFNode(
  node: IChartNode,
  test?: ITest,
  canvasUpdate?: () => void
): IRFNode & CardNodeProps {
  const rfNode = getRFNodeBase(node, test);
  return {
    ...rfNode,
    type: 'card',
    data: {
      ...rfNode.data,
      source: false,
      target: true,
      useDialog: () => useSetterDialog({node, test, canvasUpdate})
    }
  };
}

export function getItem(): Item {
  return {
    className,
    icon: <TimelineIcon />,
    text: 'Chart',
    onDrop: (position: XYPosition, temporary: boolean) =>
      new ChartNode({
        name: 'Chart',
        position,
        nodeID: temporary ? 'temp' : undefined
      })
  };
}

function useSetterDialog(props: {
  node: IChartNode;
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
      >
        <SetterContent node={node} test={test} />
      </FlowNodeDialog>
    ) : null,
    setOpen
  ];
}

function SetterContent(props: {node: IChartNode; test: ITest}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {node, test} = props;

  return (
    <Box
      component="div"
      sx={{
        width: '100%',
        height: '100%'
      }}
    />
  );
}
