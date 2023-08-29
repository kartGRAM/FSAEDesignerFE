import * as React from 'react';
import {CardNodeProps} from '@gdComponents/side-panel-components/analysis/CardNode';
import {Node as IRFNode} from 'reactflow';
import {ITest, ITestSolver} from '@gd/analysis/ITest';
import {
  className,
  IChartNode,
  ChartNode,
  isChartNode
} from '@gd/analysis/ChartNode';
import {Item, XYPosition} from '@gd/analysis/FlowNode';
import FlowNodeDialog from '@gdComponents/side-panel-components/analysis/FlowNodeDialog';
import TimelineIcon from '@mui/icons-material/Timeline';
import {Chart} from '@gdComponents/Chart/Chart';
import {DataSelector} from '@gdComponents/Chart/DataSelector';
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

  const handleClose = () => {
    setOpen(false);
    if (canvasUpdate) canvasUpdate();
  };

  const handleApply = () => {
    test?.addCompletedState();
  };

  return [
    test ? (
      <FlowNodeDialog
        key={node.nodeID}
        node={node}
        test={test}
        open={open}
        onClose={handleClose}
        onApply={handleApply}
        paperProps={{
          sx: {
            width: '80%',
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

  const setData = (data: IChartData[]) => {
    node.data = [...data];
    updateWithSave();
  };
  const setLayout = (layout: IChartLayout) => {
    node.layout = {...layout};
    updateWithSave();
  };

  const tempSolver = React.useRef<ITestSolver>(test.solver);

  const pData = node.getPlotlyData(tempSolver.current);
  const {caseResults, localInstances} = tempSolver.current;
  if (!caseResults || !localInstances) return null;

  const dataSelector = (
    <DataSelector
      results={caseResults}
      localInstances={localInstances}
      data={data}
      setData={setData}
    />
  );

  return (
    <Chart
      data={pData}
      layout={layout}
      sx={{
        flexGrow: 1,
        position: 'relative',
        height: '100%',
        minWidth: '0px' // minWidthを指定しないとFlexBoxがうまく動かない
      }}
      setLayout={setLayout}
      dataSelector={dataSelector}
    />
  );
}
