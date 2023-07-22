import {Layout, PlotData, Datum, TypedArray, ErrorBar} from 'plotly.js';

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
  x: DataRef;
  y: DataRef;
  z?: DataRef;
  xaxis: xAxis;
  yaxis: yAxis;
}

export type DataRef = {
  case: string | 'All';
  from: 'element' | 'measureTool' | 'global' | 'special' | 'control';
  nodeID: string;
};

interface IChartLayout extends Partial<Layout> {}

type Digit = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type xAxis = `x${Digit}` | `x${Digit}${Digit | '0'}`;
type yAxis = `y${Digit}` | `y${Digit}${Digit | '0'}`;

export interface IPlotData extends WOData {
  type: Exclude<WOData['type'], undefined>;
  x: Datum[] | Datum[][] | TypedArray;
  y: Datum[] | Datum[][] | TypedArray;
  z?: Datum[] | Datum[][] | Datum[][][] | TypedArray;
  i?: TypedArray;
  j?: TypedArray;
  k?: TypedArray;
  xy?: Float32Array;
  error_x?: ErrorBar;
  error_y?: ErrorBar;
  xaxis: xAxis;
  yaxis: yAxis;
}

export type {Datum, TypedArray, ErrorBar};
