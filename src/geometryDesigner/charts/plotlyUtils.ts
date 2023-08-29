import {PlotType} from 'plotly.js';

export function is3DPlotType(type: PlotType) {
  if (type === 'scatter3d' || type === 'heatmap' || type === 'contour')
    return true;
  return false;
}
