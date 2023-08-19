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
import {Chart} from '@gdComponents/Chart/Chart';
import {ChartSelector, Mode} from '@gdComponents/Chart/ChartSelector';
import {grey} from '@mui/material/colors';
import useTestUpdate from '@hooks/useTestUpdate';
import {IChartData, IChartLayout} from '@gd/charts/ICharts';
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
      backgroundColor: test?.solver.done ? undefined : grey[500],
      dialogDisabled: !test?.solver.done,
      useDialog: () => useChartDialog({node, test, canvasUpdate})
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

function useChartDialog(props: {
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
        paperProps={{
          sx: {
            minWidth: '80%',
            height: '80%',
            '.MuiDialogContent-root': {p: '0!important'}
          }
        }}
      >
        <ChartContent node={node} test={test} />
      </FlowNodeDialog>
    ) : null,
    setOpen
  ];
}

function ChartContent(props: {node: IChartNode; test: ITest}) {
  const {node, test} = props;
  const {data, layout} = node;
  const {updateWithSave} = useTestUpdate(test);
  const [mode] = React.useState<Mode>('DataSelect');

  const setData = (data: IChartData[]) => {
    node.data = [...data];
    updateWithSave();
  };
  const setLayout = (layout: IChartLayout) => {
    node.layout = {...layout};
    updateWithSave();
  };

  const index = undefined;

  const pData = node.getPlotlyData(test);
  const {caseResults, localInstances} = test.solver;
  if (!caseResults || !localInstances) return null;

  return (
    <Box
      component="div"
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        p: 0,
        pl: 1,
        pr: 1,
        m: 0,
        display: 'flex',
        flexDirection: 'row'
      }}
      draggable={false}
    >
      <Box
        component="div"
        sx={{
          minWidth: '45vh',
          height: '100%'
        }}
      >
        <ChartSelector
          results={caseResults}
          localInstances={localInstances}
          data={data}
          setData={setData}
          layout={layout}
          setLayout={setLayout}
          mode={mode}
          dataIndex={index}
        />
      </Box>
      <Chart
        data={pData}
        layout={layout}
        sx={{
          flexGrow: 1,
          position: 'relative',
          minWidth: '0px' // minWidthを指定しないとFlexBoxがうまく動かない
        }}
      />
    </Box>
  );
}
