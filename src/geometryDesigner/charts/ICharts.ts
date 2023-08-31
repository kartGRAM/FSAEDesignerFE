import {
  Layout,
  PlotData,
  Datum,
  TypedArray,
  ErrorBar,
  Font,
  Padding
} from 'plotly.js';
import * as math from 'mathjs';

export interface IDataChartArea {
  nodeID: string;
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
  nodeID: string;
  type: Exclude<WOData['type'], undefined>;
  x: DataRef;
  y: DataRef;
  z: DataRef;
  xaxis: xAxis;
  yaxis: yAxis;
}

export const dataFrom = [
  'element',
  'measureTool',
  'readonlyVariable',
  'global',
  'special'
] as const;

export type DataRef = {
  case: string | 'All';
  from: typeof dataFrom[number];
  nodeID: string;
  stats?: Stats;
};

export interface IChartLayout extends Partial<Layout> {
  title?:
    | string
    | Partial<{
        text: string;
        font: Partial<Font>;
        xref: 'container' | 'paper';
        yref: 'container' | 'paper';
        x: number;
        y: number;
        xanchor: 'auto' | 'left' | 'center' | 'right';
        yanchor: 'auto' | 'top' | 'middle' | 'bottom';
        pad: Partial<Padding>;
        automargin: boolean;
      }>;
}

type Digit = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
export type xAxis = `x${Digit}` | `x${Digit}${Digit | '0'}`;
export type yAxis = `y${Digit}` | `y${Digit}${Digit | '0'}`;
export type SubPlot = `${'x' | Exclude<xAxis, 'x1'>}${
  | 'y'
  | Exclude<yAxis, 'y1'>}`;

const sx: (xAxis | 'x')[] = [
  'x',
  ...([...Array(98)].map((_, i) => `x${i + 2}`) as xAxis[])
];
const sy: (yAxis | 'y')[] = [
  'y',
  ...([...Array(98)].map((_, i) => `y${i + 2}`) as yAxis[])
];
export const subplots: SubPlot[] = sx
  .map((x) => sy.map((y) => x + y))
  .flat() as SubPlot[];

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

export type Stats = 'min' | 'max' | 'mean' | 'median';

// eslint-disable-next-line consistent-return
export function getStats(stats: Stats): (values: number[]) => number {
  // eslint-disable-next-line default-case
  switch (stats) {
    case 'max':
      return (values: number[]) => Math.max(...values);
    case 'min':
      return (values: number[]) => Math.min(...values);
    case 'mean':
      return math.mean;
    case 'median':
      return math.median;
  }
}
