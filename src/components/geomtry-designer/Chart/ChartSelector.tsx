import * as React from 'react';
import {IChartLayout} from '@gd/charts/ICharts';
import {PlotType} from 'plotly.js';

export type Mode =
  | 'DataSelect'
  | 'XAxis'
  | 'YAxis'
  | 'ZAxis'
  | 'DataVisualization';

export function ChartSelector(props: {
  mode: Mode;
  type: PlotType;
  // eslint-disable-next-line react/no-unused-prop-types
  setPlotType: React.Dispatch<React.SetStateAction<PlotType>>;

  dataSelector: (type: PlotType) => JSX.Element;
  // eslint-disable-next-line react/no-unused-prop-types
  setLayout: (layout: IChartLayout) => void;
}) {
  const {mode, dataSelector, type} = props;
  if (mode === 'DataSelect') {
    return dataSelector(type);
  }
  return null;
}
