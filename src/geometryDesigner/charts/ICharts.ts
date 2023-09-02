import {
  Layout,
  LayoutAxis,
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
  xaxis: XAxis;
  yaxis: YAxis;
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
export type XAxis = `x${Digit}` | `x${Digit}${Digit | '0'}`;
export type YAxis = `y${Digit}` | `y${Digit}${Digit | '0'}`;
export type ZAxis = never; // `z${Digit}` | `z${Digit}${Digit | '0'}`;

export const xAxes = [...Array(9)].map((_, i) => `x${i + 1}`) as XAxis[];
export const yAxes = [...Array(9)].map((_, i) => `y${i + 1}`) as YAxis[];
export const zAxes = [] as ZAxis[];
export const axesSet = {x: xAxes, y: yAxes, z: zAxes} as const;

export type SubPlot = `${'x' | Exclude<XAxis, 'x1'>}${
  | 'y'
  | Exclude<YAxis, 'y1'>}`;

const sx: (XAxis | 'x')[] = [
  'x',
  ...([...Array(98)].map((_, i) => `x${i + 2}`) as XAxis[])
];
const sy: (YAxis | 'y')[] = [
  'y',
  ...([...Array(98)].map((_, i) => `y${i + 2}`) as YAxis[])
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
  xaxis: XAxis;
  yaxis: YAxis;
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

export const defaultLayoutAxis: Partial<LayoutAxis> = {
  visible: true,
  autorange: true
};
