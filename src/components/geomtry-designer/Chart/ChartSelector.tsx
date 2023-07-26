import * as React from 'react';
import {IChartData, IChartLayout} from '@gd/charts/ICharts';
import {Box} from '@mui/material';

export type Mode =
  | 'DataSelect'
  | 'XAxis'
  | 'YAxis'
  | 'ZAxis'
  | 'DataVisualization';

export function ChartSelector(props: {
  data: IChartData[];
  setData: (data: IChartData[]) => void;
  layout: IChartLayout;
  setLayout: (layout: IChartLayout) => void;
  mode: Mode;
  dataIndex: number | undefined;
}): JSX.Element | null {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {data, setData, layout, setLayout, mode, dataIndex} = props;
  return <Box component="div">aaa</Box>;
}
