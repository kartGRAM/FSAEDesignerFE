import {IChartLayout} from '@gd/charts/ICharts';

export type Mode =
  | 'DataSelect'
  | 'XAxis'
  | 'YAxis'
  | 'ZAxis'
  | 'DataVisualization';

export function ChartSelector(props: {
  mode: Mode;
  dataSelector: JSX.Element;
  // eslint-disable-next-line react/no-unused-prop-types
  setLayout: (layout: IChartLayout) => void;
}) {
  const {mode, dataSelector} = props;
  if (mode === 'DataSelect') {
    return dataSelector;
  }
  return null;
}
