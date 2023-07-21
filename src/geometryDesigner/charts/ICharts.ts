import {Layout, PlotData} from 'plotly.js';

export interface IDataChartArea {
  layouts: IChartLayout;
  data: IChartData[];
}

interface WOData
  extends Partial<
    Omit<
      PlotData,
      'x' | 'y' | 'z' | 'i' | 'j' | 'k' | 'xy' | 'error_x' | 'error_y'
    >
  > {}

export interface IChartData extends WOData {
  type: Exclude<WOData['type'], undefined>;
  x: NodeID;
  y: NodeID;
  z?: NodeID;
  xaxis: xAxis;
  yaxis: yAxis;
}

type NodeID = {
  target: 'element' | 'measureTool' | 'global' | 'special';
  nodeID: string;
};

interface IChartLayout extends Partial<Layout> {}

type Digit = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type xAxis = `x${Digit}` | `x${Digit}${Digit | '0'}`;
type yAxis = `y${Digit}` | `y${Digit}${Digit | '0'}`;
