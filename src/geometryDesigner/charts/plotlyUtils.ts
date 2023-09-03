import {PlotType, Layout} from 'plotly.js';

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

export const hovermodes: Layout['hovermode'][] = [
  'closest',
  'x',
  'y',
  'x unified',
  'y unified',
  false
];
