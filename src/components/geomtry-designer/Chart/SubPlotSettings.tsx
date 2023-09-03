import * as React from 'react';
import {LayoutAxis} from 'plotly.js';
import {IChartLayout, SubPlot} from '@gd/charts/ICharts';
import {
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Checkbox
} from '@mui/material';
import Settings from '@gdComponents/svgs/Settings';
import {deepCopy} from '@utils/helpers';
import {Mode} from './ChartSelector';

export const SubPlotSettings = React.memo(
  (props: {
    setMode: (mode: Mode) => void;
    subplotTarget: SubPlot;
    layout: IChartLayout;
    setLayout: (layout: IChartLayout) => void;
    axes: string[];
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {setMode, subplotTarget, layout, setLayout, axes} = props;
    const isSubplotMode = !!layout.grid;

    return (
      <TableContainer>
        <Table size="small">
          <TableBody>
            <AxesVisualization
              setMode={setMode}
              layout={layout}
              setLayout={setLayout}
              axes={axes}
              isSubplotMode={isSubplotMode}
            />
            <TableRow>
              <TableCell scope="row" padding="none" align="left" key="from">
                show legends
              </TableCell>
              <TableCell scope="row" padding="none" align="left" key="node">
                <Checkbox
                  checked={layout.showlegend ?? true}
                  onChange={(_, c) => {
                    const newLayout = deepCopy(layout);
                    newLayout.showlegend = c;
                    setLayout(newLayout);
                  }}
                />
              </TableCell>
              <TableCell scope="row" padding="none" align="left" key="case">
                <Settings title="Axis settings" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
);

const AxesVisualization = React.memo(
  (props: {
    setMode: (mode: Mode) => void;
    layout: IChartLayout;
    setLayout: (layout: IChartLayout) => void;
    axes: string[];
    isSubplotMode: boolean;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {setMode, layout, setLayout, axes, isSubplotMode} = props;
    const handleChange = React.useCallback(
      (axis: string, checked: boolean) => {
        const newLayout = deepCopy(layout);
        const layoutAxis = (newLayout as any)[axis] as Partial<LayoutAxis>;
        layoutAxis.visible = checked;
        setLayout(newLayout);
      },
      [layout, setLayout]
    );
    if (isSubplotMode) return null;
    return (
      <>
        {axes.map((axis) => {
          const layoutAxis = (layout as any)[axis] as Partial<LayoutAxis>;
          return (
            <TableRow>
              <TableCell scope="row" padding="none" align="left" key="from">
                {axis}
              </TableCell>
              <TableCell scope="row" padding="none" align="left" key="node">
                <Checkbox
                  checked={!!layoutAxis.visible}
                  onChange={(_, c) => handleChange(axis, c)}
                />
              </TableCell>
              <TableCell scope="row" padding="none" align="left" key="case">
                <Settings title="Axis settings" />
              </TableCell>
            </TableRow>
          );
        })}
      </>
    );
  }
);
