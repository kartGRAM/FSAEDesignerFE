import {PlotType, Layout, Legend, LegendTitle, AxisType, Axis} from 'plotly.js';

export function is3DPlotType(type: PlotType) {
  if (type === 'scatter3d' || type === 'heatmap' || type === 'contour')
    return true;
  return false;
}

export const plotTypes: PlotType[] = [
  'bar',
  'barpolar',
  'box',
  'candlestick',
  'carpet',
  'choropleth',
  'choroplethmapbox',
  'cone',
  'contour',
  'contourcarpet',
  'densitymapbox',
  'funnel',
  'funnelarea',
  'heatmap',
  'heatmapgl',
  'histogram',
  'histogram2d',
  'histogram2dcontour',
  'image',
  'indicator',
  'isosurface',
  'mesh3d',
  'ohlc',
  'parcats',
  'parcoords',
  'pie',
  'pointcloud',
  'sankey',
  'scatter',
  'scatter3d',
  'scattercarpet',
  'scattergeo',
  'scattergl',
  'scattermapbox',
  'scatterpolar',
  'scatterpolargl',
  'scatterternary',
  'splom',
  'streamtube',
  'sunburst',
  'surface',
  'table',
  'treemap',
  'violin',
  'volume',
  'waterfall'
];

export const hoverModes: Layout['hovermode'][] = [
  'closest',
  'x',
  'y',
  'x unified',
  'y unified',
  false
];

export const dragModes: Layout['dragmode'][] = [
  'zoom',
  'pan',
  'select',
  'lasso',
  'orbit',
  'turntable',
  false
];

export const barModes: Layout['barmode'][] = [
  'stack',
  'group',
  'overlay',
  'relative'
];

export const barNorms: Layout['barnorm'][] = ['', 'fraction', 'percent'];

export const boxModes: Layout['boxmode'][] = ['group', 'overlay'];

export const selectDirections: Layout['selectdirection'][] = [
  'h',
  'v',
  'd',
  'any'
];

export const clickModes: Layout['clickmode'][] = [
  'event',
  'select',
  'event+select',
  'none'
];

export const groupClicks: Legend['groupclick'][] = [
  'toggleitem',
  'togglegroup'
];
export const itemClicks: Legend['itemclick'][] = [
  'toggle',
  'toggleothers',
  false
];
export const itemSizings: Legend['itemsizing'][] = ['trace', 'constant'];
export const orientations: Legend['orientation'][] = ['v', 'h'];
export const traceOrders: Legend['traceorder'][] = [
  'grouped',
  'normal',
  'reversed',
  'reversed+grouped'
];
export const vAligns: Legend['valign'][] = ['top', 'middle', 'bottom'];
export const xAnchors: Legend['xanchor'][] = [
  'auto',
  'left',
  'center',
  'right'
];
export const yAnchors: Legend['yanchor'][] = [
  'auto',
  'top',
  'middle',
  'bottom'
];
export const legendTitleSides: LegendTitle['side'][] = [
  'top',
  'left',
  'top left'
];

export const axisTypes: AxisType[] = [
  '-',
  'linear',
  'log',
  'date',
  'category',
  'multicategory'
];

export const autoRanges: Axis['autorange'][] = [true, false, 'reversed'];

export const rangeModes: Axis['rangemode'][] = [
  'normal',
  'tozero',
  'nonnegative'
];

export const tickModes: Axis['tickmode'][] = ['auto', 'linear', 'array'];

export const ticks: Axis['ticks'][] = ['outside', 'inside', ''];

export const mirrors: Axis['mirror'][] = [
  true,
  'ticks',
  false,
  'all',
  'allticks'
];

export const categoryOrders: Axis['categoryorder'][] = [
  'trace',
  'category ascending',
  'category descending',
  'array',
  'total ascending',
  'total descending',
  'min ascending',
  'min descending',
  'max ascending',
  'max descending',
  'sum ascending',
  'sum descending',
  'mean ascending',
  'mean descending',
  'median ascending',
  'median descending'
];

export const showTickPrefixes: Axis['showtickprefix'][] = [
  'all',
  'first',
  'last',
  'none'
];

export const showTickSuffixes: Axis['showticksuffix'][] = [
  'all',
  'first',
  'last',
  'none'
];

export const showExponents: Axis['showexponent'][] = [
  'all',
  'first',
  'last',
  'none'
];

export const exponentFormats: Axis['exponentformat'][] = [
  'none',
  'e',
  'E',
  'power',
  'SI',
  'B'
];

export const spikeModes: Axis['spikemode'][] = [
  'toaxis',
  'across',
  'marker',
  'toaxis+across',
  'toaxis+across+marker',
  'across+marker',
  'toaxis+marker'
];

export const spikeSnap: Axis['spikesnap'][] = [
  'data',
  'cursor',
  'hovered data'
];

export const spikeDashes = [
  'solid',
  'dot',
  'dash',
  'longdash',
  'dashdot',
  'longdashdot'
] as const;
