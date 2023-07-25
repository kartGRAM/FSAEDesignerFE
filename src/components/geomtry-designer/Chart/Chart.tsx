import * as React from 'react';
import {PlotData} from 'plotly.js';
import {IChartLayout} from '@gd/charts/ICharts';
import Plot from 'react-plotly.js';
import Box, {BoxProps} from '@mui/material/Box';

// データの型指定でPartial<PlotData>をつけておくと型サポート使えて便利です
// データ群1
const data1: Partial<PlotData> = {
  type: 'scatter3d',
  x: [1, 5, 9, 7],
  y: [-9, 4, 3, 0],
  z: [2, 2, 2, 2],
  marker: {symbol: 'circle', opacity: 1, size: 3},
  mode: 'markers',
  text: ['A', 'B', 'C', 'D'],
  name: 'Group_1'
};

// データ群2 ちなみに群1と群2は自動で色分けしてくれる。便利！
// 手動で設定したいなら marker:{color:***}
const data2: Partial<PlotData> = {
  type: 'scatter3d',
  x: [-6, 5, 3, -2],
  y: [-4, 9, 4, 6],
  z: [-2, -2, -2, -2],
  marker: {symbol: 'circle', opacity: 1, size: 3},
  mode: 'markers',
  text: ['E', 'F', 'G', 'H'],
  name: 'Group_2'
};

// 以下はXYZの軸が欲しかったので無理矢理作った
const lineX: Partial<PlotData> = {
  type: 'scatter3d',
  x: [-10, 10],
  y: [0, 0],
  z: [0, 0],
  showlegend: false,
  mode: 'lines',
  line: {color: 'black'}
};

const lineY: Partial<PlotData> = {
  type: 'scatter3d',
  x: [0, 0],
  y: [-10, 10],
  z: [0, 0],
  showlegend: false,
  mode: 'lines',
  line: {color: 'black'}
};

const lineZ: Partial<PlotData> = {
  type: 'scatter3d',
  x: [0, 0],
  y: [0, 0],
  z: [-10, 10],
  mode: 'lines',
  showlegend: false,
  line: {color: 'black'},
  name: 'trace1'
};

const testLayout: IChartLayout = {
  title: {text: 'test chart', automargin: true},
  autosize: true,
  margin: {t: 24, b: 0, l: 0, r: 0}
};

// 下にある<Plot data = {}> のdataの型は Partial<PlotData>[]
// サンプルとしてわかりやすいように型を書いています
const allData: Partial<PlotData>[] = [data1, data2, lineX, lineY, lineZ];

export interface ChartProps extends BoxProps {
  data?: Partial<PlotData>[];
  layout?: IChartLayout;
}

export function Chart(props: ChartProps): React.ReactElement {
  const {layout, data} = props;
  if (layout) {
    layout.autosize = true;
    if (!layout.margin) {
      layout.margin = {t: 24, b: 0, l: 0, r: 0};
    }
  }
  return (
    <Box {...props} component="div">
      <Plot
        data={data ?? allData}
        layout={layout ?? testLayout}
        useResizeHandler
        style={{width: '100%', height: '100%'}}
      />
    </Box>
  );
}
