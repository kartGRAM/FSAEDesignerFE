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
  axisTypes,
  autoRanges,
  rangeModes,
  tickModes,
  ticks,
  mirrors,
  categoryOrders,
  showTickPrefixes,
  showTickSuffixes,
  showExponents,
  exponentFormats,
  spikeDashes,
  spikeModes,
  spikeSnaps
} from '@gd/charts/plotlyUtils';
import {LayoutAxis} from 'plotly.js';
import {Mode} from './ChartSelector';
import {
  CheckBoxRow,
  ColorPickerRow,
  NullableColorPickerRow,
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
              selection={mirrors}
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
            <NullableNumberRow
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
            <CheckBoxRow
              name="show spikes"
              value={layoutAxis.showspikes ?? true}
              setValue={apply((prev, c) => {
                prev.showspikes = c;
              })}
            />
            <NullableColorPickerRow
              name="spike color"
              color={(layoutAxis.tickcolor as string | undefined) ?? '#444444'}
              onChange={apply((prev, value) => {
                prev.tickcolor = value;
              })}
            />
            <NumberRow
              name="spike thickness"
              value={layoutAxis.spikethickness ?? 3}
              min={0}
              setValue={apply((prev, value) => {
                prev.spikethickness = value;
              })}
            />
            <SelectorRow
              name="category order"
              selection={categoryOrders}
              value={layoutAxis?.categoryorder}
              onChange={apply((prev, value) => {
                prev.categoryorder = value;
              })}
            />
            {
              // categoryArray
            }
            <FontRows
              name="tick font"
              font={layoutAxis?.tickfont}
              setValue={apply((prev, value) => {
                prev.tickfont = value;
              })}
            />
            {
              // itickAngle
            }
            <StringRow
              name="tick prefix"
              value={layoutAxis.tickprefix}
              setValue={apply((prev, value) => {
                prev.tickprefix = value;
              })}
            />
            <SelectorRow
              name="show tick prefix"
              selection={showTickPrefixes}
              value={layoutAxis?.showtickprefix}
              onChange={apply((prev, value) => {
                prev.showtickprefix = value;
              })}
            />
            <StringRow
              name="tick suffix"
              value={layoutAxis.ticksuffix}
              setValue={apply((prev, value) => {
                prev.ticksuffix = value;
              })}
            />
            <SelectorRow
              name="show tick suffix"
              selection={showTickSuffixes}
              value={layoutAxis?.showticksuffix}
              onChange={apply((prev, value) => {
                prev.showticksuffix = value;
              })}
            />
            <SelectorRow
              name="show exponent"
              selection={showExponents}
              value={layoutAxis?.showexponent}
              onChange={apply((prev, value) => {
                prev.showexponent = value;
              })}
            />
            <SelectorRow
              name="exponent format"
              selection={exponentFormats}
              value={layoutAxis?.exponentformat}
              onChange={apply((prev, value) => {
                prev.exponentformat = value;
              })}
            />
            <CheckBoxRow
              name="separate thousands"
              value={layoutAxis.separatethousands ?? false}
              setValue={apply((prev, c) => {
                prev.separatethousands = c;
              })}
            />
            <StringRow
              name="tick format"
              value={layoutAxis.tickformat}
              setValue={apply((prev, value) => {
                prev.tickformat = value;
              })}
            />
            <StringRow
              name="hover format"
              value={layoutAxis.hoverformat}
              setValue={apply((prev, value) => {
                prev.hoverformat = value;
              })}
            />
            {
              // itickformatstops
            }
            <SelectorRow
              name="spike dash"
              selection={spikeDashes}
              value={layoutAxis?.spikedash as typeof spikeDashes[number]}
              onChange={apply((prev, value) => {
                prev.spikedash = value;
              })}
            />
            <SelectorRow
              name="spike mode"
              selection={spikeModes}
              value={layoutAxis?.spikemode}
              onChange={apply((prev, value) => {
                prev.spikemode = value;
              })}
            />
            <SelectorRow
              name="spike snaps"
              selection={spikeSnaps}
              value={layoutAxis?.spikesnap}
              onChange={apply((prev, value) => {
                prev.spikesnap = value;
              })}
            />
            <CheckBoxRow
              name="show line"
              value={layoutAxis.showline ?? false}
              setValue={apply((prev, c) => {
                prev.showline = c;
              })}
            />
            <ColorPickerRow
              name="line color"
              color={(layoutAxis.linecolor as string | undefined) ?? '#444444'}
              onChange={apply((prev, value) => {
                prev.linecolor = value;
              })}
            />
            <NumberRow
              name="line width"
              value={layoutAxis.linewidth ?? 1}
              min={0}
              setValue={apply((prev, value) => {
                prev.linewidth = value;
              })}
            />
            <CheckBoxRow
              name="show grid"
              value={layoutAxis.showgrid ?? false}
              setValue={apply((prev, c) => {
                prev.showgrid = c;
              })}
            />
            <ColorPickerRow
              name="grid color"
              color={(layoutAxis.linecolor as string | undefined) ?? '#eeeeee'}
              onChange={apply((prev, value) => {
                prev.gridcolor = value;
              })}
            />
            <NumberRow
              name="grid width"
              value={layoutAxis.gridwidth ?? 1}
              min={0}
              setValue={apply((prev, value) => {
                prev.gridwidth = value;
              })}
            />
            <CheckBoxRow
              name="zero line"
              value={layoutAxis.zeroline ?? false}
              setValue={apply((prev, c) => {
                prev.zeroline = c;
              })}
            />
            <ColorPickerRow
              name="zero line color"
              color={
                (layoutAxis.zerolinecolor as string | undefined) ?? '#444444'
              }
              onChange={apply((prev, value) => {
                prev.zerolinecolor = value;
              })}
            />
            <NumberRow
              name="zero line width"
              value={layoutAxis.zerolinewidth ?? 1}
              min={0}
              setValue={apply((prev, value) => {
                prev.zerolinewidth = value;
              })}
            />
            <CheckBoxRow
              name="show dividers"
              value={layoutAxis.showdividers ?? false}
              setValue={apply((prev, c) => {
                prev.showdividers = c;
              })}
            />
            <ColorPickerRow
              name="divider color"
              color={
                (layoutAxis.dividercolor as string | undefined) ?? '#444444'
              }
              onChange={apply((prev, value) => {
                prev.dividercolor = value;
              })}
            />
            <NumberRow
              name="divider width"
              value={layoutAxis.zerolinewidth ?? 1}
              min={0}
              setValue={apply((prev, value) => {
                prev.dividerwidth = value;
              })}
            />
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
);
