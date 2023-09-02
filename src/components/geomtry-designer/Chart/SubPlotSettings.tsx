import * as React from 'react';
import {IChartLayout, SubPlot} from '@gd/charts/ICharts';

export const SubPlotSettings = React.memo(
  (props: {
    subplotTarget: SubPlot;
    layout: IChartLayout;
    setLayout: (layout: IChartLayout) => void;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {subplotTarget, layout, setLayout} = props;
    return null;
  }
);
