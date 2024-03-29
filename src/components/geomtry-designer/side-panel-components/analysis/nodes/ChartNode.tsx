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
import {IChartData, IChartLayout, IPlotData} from '@gd/charts/ICharts';
import {PlotType} from 'plotly.js';
import {Mode} from '@gdComponents/Chart/ChartSelector';
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
    onDrop: (position: XYPosition, temporary: boolean, testID: string) =>
      new ChartNode(
        {
          name: 'Chart',
          position,
          nodeID: temporary ? 'temp' : undefined
        },
        testID
      )
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

  const setData = React.useCallback(
    (data: IChartData[]) => {
      node.data = [...data];
      updateWithSave();
    },
    [node, updateWithSave]
  );
  const setPData = React.useCallback(
    (data: IPlotData) => {
      node.data = node.data.map((d) => {
        if (d.nodeID === (data as any).nodeID) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const {x: _, y: __, z: ___, ...copy} = data;
          return {...d, ...copy};
        }
        return d;
      });
      updateWithSave();
    },
    [node, updateWithSave]
  );

  const setLayout = React.useCallback(
    (layout: IChartLayout) => {
      node.layout = {...layout};
      updateWithSave();
    },
    [node, updateWithSave]
  );

  const setPlotTypeAll = React.useCallback(
    (type: PlotType) => {
      node.data = data.map((datum) => ({...datum, type}));
      updateWithSave();
    },
    [data, node, updateWithSave]
  );

  const [mode, setMode] = React.useState<Mode>('DataSelect');
  const [targetDataIdx, setTargetDataIdx] = React.useState<number | undefined>(
    undefined
  );

  const tempSolver = React.useRef<ITestSolver>(test.solver);

  const pData = node.getPlotlyData(tempSolver.current);
  const {caseResults, localInstances} = tempSolver.current;
  if (!caseResults || !localInstances) return null;

  let plotType: PlotType | 'composite' = data[0] ? data[0].type : 'scatter';
  if (data.length) {
    plotType = data.reduce(
      (prev: PlotType | 'composite', current) =>
        prev === current.type ? prev : 'composite',
      data[0].type
    );
  }

  const dataSelector = (
    <DataSelector
      results={caseResults}
      localInstances={localInstances}
      data={data}
      setData={setData}
      defaultPlotType={data[0] ? data[0].type : 'scatter'}
      setMode={setMode}
      setTargetDataIdx={setTargetDataIdx}
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
      setData={setPData}
      setLayout={setLayout}
      setPlotTypeAll={setPlotTypeAll}
      dataSelector={dataSelector}
      type={plotType}
      mode={mode}
      setMode={setMode}
      targetDataIdx={targetDataIdx}
      setTargetDataIdx={setTargetDataIdx}
    />
  );
}
