import * as React from 'react';
import {IChartLayout} from '@gd/charts/ICharts';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import {deepCopy} from '@utils/helpers';
import {
  groupClicks,
  itemClicks,
  itemSizings,
  orientations,
  traceOrders,
  vAligns,
  xAnchors,
  yAnchors,
  legendTitleSides,
  axisTypes,
  autoRanges,
  rangeModes,
  tickModes,
  ticks,
  mirrors,
  categoryOrders
} from '@gd/charts/plotlyUtils';
import {LayoutAxis} from 'plotly.js';
import {Mode} from './ChartSelector';
import {
  CheckBoxRow,
  ColorPickerRow,
  SelectorRow,
  NumberRow,
  FontRows,
  StringRow,
  NullableNumberRow
} from './SettingRows';

export const AxisSettings = React.memo(
  (props: {
    setMode: (mode: Mode) => void;
    layout: IChartLayout;
    setLayout: (layout: IChartLayout) => void;
    axis: string;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {setMode, layout, setLayout, axis} = props;
    const layoutAxis = ((layout as any)[axis] as Partial<LayoutAxis>) ?? {};

    const apply = <T,>(
      func: (prev: Partial<LayoutAxis>, newValue: T) => void
    ) => {
      return (value: T) => {
        const newLayout = deepCopy(layout);
        func(layoutAxis, value);
        (newLayout as any)[axis] = layoutAxis;
        setLayout(newLayout);
      };
    };

    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell scope="row" align="left">
                item
              </TableCell>
              <TableCell scope="row" padding="none" align="left">
                value
              </TableCell>
              <TableCell scope="row" padding="none" align="left" />
            </TableRow>
          </TableHead>
          <TableBody>
            <CheckBoxRow
              name="visible"
              value={layoutAxis.visible ?? true}
              setValue={apply((prev, c) => {
                prev.visible = c;
              })}
            />
            <ColorPickerRow
              name="color"
              color={(layoutAxis.color as string | undefined) ?? '#444444'}
              onChange={apply((prev, c) => {
                prev.color = c;
              })}
            />
            {
              // title
            }
            <SelectorRow
              name="axis type"
              selection={axisTypes}
              value={layoutAxis?.type}
              onChange={apply((prev, value) => {
                prev.type = value;
              })}
            />
            <SelectorRow
              name="auto range"
              selection={autoRanges}
              value={layoutAxis?.autorange}
              onChange={apply((prev, value) => {
                prev.autorange = value;
              })}
            />
            <SelectorRow
              name="range mode"
              selection={rangeModes}
              value={layoutAxis?.rangemode}
              onChange={apply((prev, value) => {
                prev.rangemode = value;
              })}
            />
            {
              // range
            }
            <CheckBoxRow
              name="fixed range"
              value={layoutAxis.fixedrange ?? false}
              setValue={apply((prev, c) => {
                prev.fixedrange = c;
              })}
            />
            <SelectorRow
              name="tick mode"
              selection={tickModes}
              value={layoutAxis?.tickmode}
              onChange={apply((prev, value) => {
                prev.tickmode = value;
              })}
            />
            <NumberRow
              name="nticks"
              value={layoutAxis.nticks ?? 5}
              min={0}
              setValue={apply((prev, value) => {
                prev.nticks = value;
              })}
            />
            <StringRow
              name="tick0"
              value={layoutAxis.tick0 as string | undefined}
              setValue={apply((prev, value) => {
                prev.tick0 = value;
              })}
            />
            <StringRow
              name="dtick"
              value={layoutAxis.dtick as string | undefined}
              setValue={apply((prev, value) => {
                prev.dtick = value;
              })}
            />
            {
              // tickvals
              // ticktexts
            }
            <SelectorRow
              name="ticks"
              selection={ticks}
              value={layoutAxis?.ticks}
              onChange={apply((prev, value) => {
                prev.ticks = value;
              })}
            />
            <SelectorRow
              name="miror"
              selection={mirros}
              value={layoutAxis?.mirror}
              onChange={apply((prev, value) => {
                prev.mirror = value;
              })}
            />
            <NullableNumberRow
              name="tick length"
              value={layoutAxis.ticklen}
              min={0}
              setValue={apply((prev, value) => {
                prev.ticklen = value;
              })}
            />
            <NumberRow
              name="tick width"
              value={layoutAxis.tickwidth}
              min={0}
              setValue={apply((prev, value) => {
                prev.tickwidth = value;
              })}
            />
            <ColorPickerRow
              name="tick color"
              color={(layoutAxis.tickcolor as string | undefined) ?? '#444444'}
              onChange={apply((prev, value) => {
                prev.tickcolor = value;
              })}
            />
            <CheckBoxRow
              name="show tick labels"
              value={layoutAxis.showticklabels ?? true}
              setValue={apply((prev, c) => {
                prev.showticklabels = c;
              })}
            />
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
);
