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

export const spikeSnaps: Axis['spikesnap'][] = [
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

export const constrains = ['range', 'domain'] as const;
export const constrainTowards = [
  'left',
  'center',
  'right',
  'top',
  'middle',
  'bottom'
] as const;
export const sides = [
  'top',
  'bottom',
  'left',
  'right',
  'clockwise',
  'counterclockwise'
] as const;
export const layers = ['above traces', 'below traces'] as const;

export const directions = ['counterclockwise', 'clockwise'] as const;

export const dashes = [
  'solid',
  'dot',
  'dash',
  'longdash',
  'dashdot',
  'longdashdot'
] as const;

export const positions = [
  'top left',
  'top center',
  'top right',
  'middle center',
  'bottom left',
  'bottom center',
  'bottom right'
] as const;

export const modes = [
  'lines',
  'markers',
  'text',
  'lines+markers',
  'text+markers',
  'text+lines',
  'text+lines+markers',
  'none'
  /* 'gauge',
  'number',
  'delta',
  'number+delta',
  'gauge+number',
  'gauge+number+delta',
  'gauge+delta' */
] as const;

export const markers = [
  'circle',
  'circle-open',
  'circle-dot',
  'circle-open-dot',
  'square',
  'square-open',
  'square-dot',
  'square-open-dot',
  'diamond',
  'diamond-open',
  'diamond-dot',
  'diamond-open-dot',
  'cross',
  'cross-open',
  'cross-dot',
  'cross-open-dot',
  'x',
  'x-open',
  'x-dot',
  'x-open-dot',
  'triangle-up',
  'triangle-up-open',
  'triangle-up-dot',
  'triangle-up-open-dot',
  'triangle-down',
  'triangle-down-open',
  'triangle-down-dot',
  'triangle-down-open-dot',
  'triangle-left',
  'triangle-left-open',
  'triangle-left-dot',
  'triangle-left-open-dot',
  'triangle-right',
  'triangle-right-open',
  'triangle-right-dot',
  'triangle-right-open-dot',
  'triangle-ne',
  'triangle-ne-open',
  'triangle-ne-dot',
  'triangle-ne-open-dot',
  'triangle-se',
  'triangle-se-open',
  'triangle-se-dot',
  'triangle-se-open-dot',
  'triangle-sw',
  'triangle-sw-open',
  'triangle-sw-dot',
  'triangle-sw-open-dot',
  'triangle-nw',
  'triangle-nw-open',
  'triangle-nw-dot',
  'triangle-nw-open-dot',
  'pentagon',
  'pentagon-open',
  'pentagon-dot',
  'pentagon-open-dot',
  'hexagon',
  'hexagon-open',
  'hexagon-dot',
  'hexagon-open-dot',
  'hexagon2',
  'hexagon2-open',
  'hexagon2-dot',
  'hexagon2-open-dot',
  'octagon',
  'octagon-open',
  'octagon-dot',
  'octagon-open-dot',
  'star',
  'star-open',
  'star-dot',
  'star-open-dot',
  'hexagram',
  'hexagram-open',
  'hexagram-dot',
  'hexagram-open-dot',
  'star-triangle-up',
  'star-triangle-up-open',
  'star-triangle-up-dot',
  'star-triangle-up-open-dot',
  'star-triangle-down',
  'star-triangle-down-open',
  'star-triangle-down-dot',
  'star-triangle-down-open-dot',
  'star-square',
  'star-square-open',
  'star-square-dot',
  'star-square-open-dot',
  'star-diamond',
  'star-diamond-open',
  'star-diamond-dot',
  'star-diamond-open-dot',
  'diamond-tall',
  'diamond-tall-open',
  'diamond-tall-dot',
  'diamond-tall-open-dot',
  'diamond-wide',
  'diamond-wide-open',
  'diamond-wide-dot',
  'diamond-wide-open-dot',
  'hourglass',
  'hourglass-open',
  'bowtie',
  'bowtie-open',
  'circle-cross',
  'circle-cross-open',
  'circle-x',
  'circle-x-open',
  'square-cross',
  'square-cross-open',
  'square-x',
  'square-x-open',
  'diamond-cross',
  'diamond-cross-open',
  'diamond-x',
  'diamond-x-open',
  'cross-thin',
  'cross-thin-open',
  'x-thin',
  'x-thin-open',
  'asterisk',
  'asterisk-open',
  'hash',
  'hash-open',
  'hash-dot',
  'hash-open-dot',
  'y-up',
  'y-up-open',
  'y-down',
  'y-down-open',
  'y-left',
  'y-left-open',
  'y-right',
  'y-right-open',
  'line-ew',
  'line-ew-open',
  'line-ns',
  'line-ns-open',
  'line-ne',
  'line-ne-open',
  'line-nw',
  'line-nw-open',
  'arrow-up',
  'arrow-up-open',
  'arrow-down',
  'arrow-down-open',
  'arrow-left',
  'arrow-left-open',
  'arrow-right',
  'arrow-right-open',
  'arrow-bar-up',
  'arrow-bar-up-open',
  'arrow-bar-down',
  'arrow-bar-down-open',
  'arrow-bar-left',
  'arrow-bar-left-open',
  'arrow-bar-right',
  'arrow-bar-right-open'
] as const;

export const colorScales = [
  'aggrnyl',
  'agsunset',
  'blackbody',
  'bluered',
  'blues',
  'blugrn',
  'bluyl',
  'brwnyl',
  'bugn',
  'bupu',
  'burg',
  'burgyl',
  'cividis',
  'darkmint',
  'electric',
  'emrld',
  'gnbu',
  'greens',
  'greys',
  'hot',
  'inferno',
  'jet',
  'magenta',
  'magma',
  'mint',
  'orrd',
  'oranges',
  'oryel',
  'peach',
  'pinkyl',
  'plasma',
  'plotly3',
  'pubu',
  'pubugn',
  'purd',
  'purp',
  'purples',
  'purpor',
  'rainbow',
  'rdbu',
  'rdpu',
  'redor',
  'reds',
  'sunset',
  'sunsetdark',
  'teal',
  'tealgrn',
  'turbo',
  'viridis',
  'ylgn',
  'ylgnbu',
  'ylorbr',
  'ylorrd',
  'algae',
  'amp',
  'deep',
  'dense',
  'gray',
  'haline',
  'ice',
  'matter',
  'solar',
  'speed',
  'tempo',
  'thermal',
  'turbid',
  'armyrose',
  'brbg',
  'earth',
  'fall',
  'geyser',
  'prgn',
  'piyg',
  'picnic',
  'portland',
  'puor',
  'rdgy',
  'rdylbu',
  'rdylgn',
  'spectral',
  'tealrose',
  'temps',
  'tropic',
  'balance',
  'curl',
  'delta',
  'oxy',
  'edge',
  'hsv',
  'icefire',
  'phase',
  'twilight',
  'mrybm',
  'mygbm'
];

export const sizeModes = ['diameter', 'area'] as const;

export const lineShapes = [
  'linear',
  'spline',
  'hv',
  'vh',
  'hvh',
  'vhv'
] as const;

export const histFuncs = ['count', 'sum', 'avg', 'min', 'max'] as const;

export const histNorms = [
  '',
  'percent',
  'probability',
  'density',
  'probability density'
] as const;

export const hoverOns = ['points', 'fills'] as const;
export const hoverInfo = [
  'all',
  'name',
  'none',
  'skip',
  'text',
  'x',
  'x+text',
  'x+name',
  'x+y',
  'x+y+text',
  'x+y+name',
  'x+y+z',
  'x+y+z+text',
  'x+y+z+name',
  'y',
  'y+name',
  'y+x',
  'y+text',
  'y+x+text',
  'y+x+name',
  'y+z',
  'y+z+text',
  'y+z+name',
  'y+x+z',
  'y+x+z+text',
  'y+x+z+name',
  'z',
  'z+x',
  'z+x+text',
  'z+x+name',
  'z+y+x',
  'z+y+x+text',
  'z+y+x+name',
  'z+x+y',
  'z+x+y+text',
  'z+x+y+name'
] as const;

export const hoverLabelAligns = ['left', 'right', 'auto'] as const;
