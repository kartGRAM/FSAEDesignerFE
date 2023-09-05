import * as React from 'react';
import {LayoutAxis} from 'plotly.js';
import {IChartLayout, SubPlot} from '@gd/charts/ICharts';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import Settings from '@gdComponents/svgs/Settings';
import {deepCopy} from '@utils/helpers';
import {
  hoverModes,
  dragModes,
  barModes,
  barNorms,
  boxModes,
  selectDirections,
  clickModes
} from '@gd/charts/plotlyUtils';
import {Mode} from './ChartSelector';
import {
  CheckBoxRow,
  ColorPickerRow,
  SelectorRow,
  NumberRow
} from './SettingRows';

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
          <TableHead>
            <TableRow>
              <TableCell
                scope="row"
                align="left"
                // sx={{width: '100%'}}
              >
                item
              </TableCell>
              <TableCell scope="row" padding="none" align="left">
                value
              </TableCell>
              <TableCell scope="row" padding="none" align="left" />
            </TableRow>
          </TableHead>
          <TableBody>
            <AxesVisualization
              setMode={setMode}
              layout={layout}
              setLayout={setLayout}
              axes={axes}
              isSubplotMode={isSubplotMode}
            />
            <CheckBoxRow
              name="legends"
              value={layout.showlegend ?? true}
              setValue={(c) => {
                const newLayout = deepCopy(layout);
                newLayout.showlegend = c;
                setLayout(newLayout);
              }}
              thirdColumn={
                <Settings
                  title="Legend settings"
                  onClick={() => setMode('LegendSettings')}
                />
              }
            />
            <ColorPickerRow
              name="paper background color"
              color={(layout.paper_bgcolor as string | undefined) ?? '#FFFFFF'}
              onChange={(c) => {
                const newLayout = deepCopy(layout);
                newLayout.paper_bgcolor = c;
                setLayout(newLayout);
              }}
            />
            <ColorPickerRow
              name="plot background color"
              color={(layout.plot_bgcolor as string | undefined) ?? '#FFFFFF'}
              onChange={(c) => {
                const newLayout = deepCopy(layout);
                newLayout.plot_bgcolor = c;
                setLayout(newLayout);
              }}
            />
            <SelectorRow
              name="hover mode"
              selection={hoverModes}
              value={layout.hovermode}
              onChange={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.hovermode = value;
                setLayout(newLayout);
              }}
            />
            <NumberRow
              name="hover distance"
              value={layout.hoverdistance ?? 20}
              min={0}
              setValue={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.hoverdistance = value;
                setLayout(newLayout);
              }}
            />
            <SelectorRow
              name="drag mode"
              selection={dragModes}
              value={layout.dragmode}
              onChange={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.dragmode = value;
                setLayout(newLayout);
              }}
            />
            <SelectorRow
              name="bar mode"
              selection={barModes}
              value={layout.barmode}
              onChange={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.barmode = value;
                setLayout(newLayout);
              }}
            />
            <SelectorRow
              name="bar norm"
              selection={barNorms}
              value={layout.barnorm}
              onChange={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.barnorm = value;
                setLayout(newLayout);
              }}
            />
            <NumberRow
              name="bar gap"
              value={layout.bargap ?? 0.15}
              setValue={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.bargap = value;
                setLayout(newLayout);
              }}
            />
            <NumberRow
              name="bar group gap"
              value={layout.bargroupgap ?? 0.15}
              setValue={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.bargroupgap = value;
                setLayout(newLayout);
              }}
            />
            <SelectorRow
              name="box mode"
              selection={boxModes}
              value={layout.boxmode}
              onChange={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.boxmode = value;
                setLayout(newLayout);
              }}
            />
            <SelectorRow
              name="select direction"
              selection={selectDirections}
              value={layout.selectdirection}
              onChange={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.selectdirection = value;
                setLayout(newLayout);
              }}
            />
            <SelectorRow
              name="click mode"
              selection={clickModes}
              value={layout.clickmode}
              onChange={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.clickmode = value;
                setLayout(newLayout);
              }}
            />
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
            <CheckBoxRow
              key={axis}
              name={axis}
              value={!!layoutAxis.visible}
              setValue={(c) => handleChange(axis, c)}
              thirdColumn={<Settings title="Axis settings" />}
            />
          );
        })}
      </>
    );
  }
);
