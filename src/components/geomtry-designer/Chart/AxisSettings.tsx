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
import {LayoutAxis, Axis} from 'plotly.js';
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
    apply: <T>(
      func: (prev: Partial<Axis>, newValue: T) => void
    ) => (value: T) => void;
    otherSettings?: JSX.Element;
    axis: Partial<Axis>;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {setMode, apply, otherSettings, axis} = props;

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
              value={axis.visible ?? true}
              setValue={apply((prev, c) => {
                prev.visible = c;
              })}
            />
            <ColorPickerRow
              name="color"
              color={(axis.color as string | undefined) ?? '#444444'}
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
              value={axis?.type}
              onChange={apply((prev, value) => {
                prev.type = value;
              })}
            />
            <SelectorRow
              name="auto range"
              selection={autoRanges}
              value={axis?.autorange}
              onChange={apply((prev, value) => {
                prev.autorange = value;
              })}
            />
            <SelectorRow
              name="range mode"
              selection={rangeModes}
              value={axis?.rangemode}
              onChange={apply((prev, value) => {
                prev.rangemode = value;
              })}
            />
            {
              // range
            }
            <CheckBoxRow
              name="fixed range"
              value={axis.fixedrange ?? false}
              setValue={apply((prev, c) => {
                prev.fixedrange = c;
              })}
            />
            <SelectorRow
              name="tick mode"
              selection={tickModes}
              value={axis?.tickmode}
              onChange={apply((prev, value) => {
                prev.tickmode = value;
              })}
            />
            <NumberRow
              name="nticks"
              value={axis.nticks ?? 5}
              min={0}
              setValue={apply((prev, value) => {
                prev.nticks = value;
              })}
            />
            <StringRow
              name="tick0"
              value={axis.tick0 as string | undefined}
              setValue={apply((prev, value) => {
                prev.tick0 = value;
              })}
            />
            <StringRow
              name="dtick"
              value={axis.dtick as string | undefined}
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
              value={axis?.ticks}
              onChange={apply((prev, value) => {
                prev.ticks = value;
              })}
            />
            <SelectorRow
              name="miror"
              selection={mirrors}
              value={axis?.mirror}
              onChange={apply((prev, value) => {
                prev.mirror = value;
              })}
            />
            <NullableNumberRow
              name="tick length"
              value={axis.ticklen}
              min={0}
              setValue={apply((prev, value) => {
                prev.ticklen = value;
              })}
            />
            <NullableNumberRow
              name="tick width"
              value={axis.tickwidth}
              min={0}
              setValue={apply((prev, value) => {
                prev.tickwidth = value;
              })}
            />
            <ColorPickerRow
              name="tick color"
              color={(axis.tickcolor as string | undefined) ?? '#444444'}
              onChange={apply((prev, value) => {
                prev.tickcolor = value;
              })}
            />
            <CheckBoxRow
              name="show tick labels"
              value={axis.showticklabels ?? true}
              setValue={apply((prev, c) => {
                prev.showticklabels = c;
              })}
            />
            <CheckBoxRow
              name="show spikes"
              value={axis.showspikes ?? true}
              setValue={apply((prev, c) => {
                prev.showspikes = c;
              })}
            />
            <NullableColorPickerRow
              name="spike color"
              color={(axis.tickcolor as string | undefined) ?? '#444444'}
              onChange={apply((prev, value) => {
                prev.tickcolor = value;
              })}
            />
            <NumberRow
              name="spike thickness"
              value={axis.spikethickness ?? 3}
              min={0}
              setValue={apply((prev, value) => {
                prev.spikethickness = value;
              })}
            />
            <SelectorRow
              name="category order"
              selection={categoryOrders}
              value={axis?.categoryorder}
              onChange={apply((prev, value) => {
                prev.categoryorder = value;
              })}
            />
            {
              // categoryArray
            }
            <FontRows
              name="tick font"
              font={axis?.tickfont}
              setValue={apply((prev, value) => {
                prev.tickfont = value;
              })}
            />
            {
              // itickAngle
            }
            <StringRow
              name="tick prefix"
              value={axis.tickprefix}
              setValue={apply((prev, value) => {
                prev.tickprefix = value;
              })}
            />
            <SelectorRow
              name="show tick prefix"
              selection={showTickPrefixes}
              value={axis?.showtickprefix}
              onChange={apply((prev, value) => {
                prev.showtickprefix = value;
              })}
            />
            <StringRow
              name="tick suffix"
              value={axis.ticksuffix}
              setValue={apply((prev, value) => {
                prev.ticksuffix = value;
              })}
            />
            <SelectorRow
              name="show tick suffix"
              selection={showTickSuffixes}
              value={axis?.showticksuffix}
              onChange={apply((prev, value) => {
                prev.showticksuffix = value;
              })}
            />
            <SelectorRow
              name="show exponent"
              selection={showExponents}
              value={axis?.showexponent}
              onChange={apply((prev, value) => {
                prev.showexponent = value;
              })}
            />
            <SelectorRow
              name="exponent format"
              selection={exponentFormats}
              value={axis?.exponentformat}
              onChange={apply((prev, value) => {
                prev.exponentformat = value;
              })}
            />
            <CheckBoxRow
              name="separate thousands"
              value={axis.separatethousands ?? false}
              setValue={apply((prev, c) => {
                prev.separatethousands = c;
              })}
            />
            <StringRow
              name="tick format"
              value={axis.tickformat}
              setValue={apply((prev, value) => {
                prev.tickformat = value;
              })}
            />
            <StringRow
              name="hover format"
              value={axis.hoverformat}
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
              value={axis?.spikedash as typeof spikeDashes[number]}
              onChange={apply((prev, value) => {
                prev.spikedash = value;
              })}
            />
            <SelectorRow
              name="spike mode"
              selection={spikeModes}
              value={axis?.spikemode}
              onChange={apply((prev, value) => {
                prev.spikemode = value;
              })}
            />
            <SelectorRow
              name="spike snaps"
              selection={spikeSnaps}
              value={axis?.spikesnap}
              onChange={apply((prev, value) => {
                prev.spikesnap = value;
              })}
            />
            <CheckBoxRow
              name="show line"
              value={axis.showline ?? false}
              setValue={apply((prev, c) => {
                prev.showline = c;
              })}
            />
            <ColorPickerRow
              name="line color"
              color={(axis.linecolor as string | undefined) ?? '#444444'}
              onChange={apply((prev, value) => {
                prev.linecolor = value;
              })}
            />
            <NumberRow
              name="line width"
              value={axis.linewidth ?? 1}
              min={0}
              setValue={apply((prev, value) => {
                prev.linewidth = value;
              })}
            />
            <CheckBoxRow
              name="show grid"
              value={axis.showgrid ?? false}
              setValue={apply((prev, c) => {
                prev.showgrid = c;
              })}
            />
            <ColorPickerRow
              name="grid color"
              color={(axis.linecolor as string | undefined) ?? '#eeeeee'}
              onChange={apply((prev, value) => {
                prev.gridcolor = value;
              })}
            />
            <NumberRow
              name="grid width"
              value={axis.gridwidth ?? 1}
              min={0}
              setValue={apply((prev, value) => {
                prev.gridwidth = value;
              })}
            />
            <CheckBoxRow
              name="zero line"
              value={axis.zeroline ?? false}
              setValue={apply((prev, c) => {
                prev.zeroline = c;
              })}
            />
            <ColorPickerRow
              name="zero line color"
              color={(axis.zerolinecolor as string | undefined) ?? '#444444'}
              onChange={apply((prev, value) => {
                prev.zerolinecolor = value;
              })}
            />
            <NumberRow
              name="zero line width"
              value={axis.zerolinewidth ?? 1}
              min={0}
              setValue={apply((prev, value) => {
                prev.zerolinewidth = value;
              })}
            />
            <CheckBoxRow
              name="show dividers"
              value={axis.showdividers ?? false}
              setValue={apply((prev, c) => {
                prev.showdividers = c;
              })}
            />
            <ColorPickerRow
              name="divider color"
              color={(axis.dividercolor as string | undefined) ?? '#444444'}
              onChange={apply((prev, value) => {
                prev.dividercolor = value;
              })}
            />
            <NumberRow
              name="divider width"
              value={axis.zerolinewidth ?? 1}
              min={0}
              setValue={apply((prev, value) => {
                prev.dividerwidth = value;
              })}
            />
            {otherSettings}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
);

export const LayoutAxisSettings = React.memo(
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
    return <AxisSettings {...props} axis={layoutAxis} apply={apply} />;
  }
);
