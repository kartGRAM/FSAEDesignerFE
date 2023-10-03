/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography
} from '@mui/material';
import {PlotMarker} from 'plotly.js';
import {IPlotData, axesSet} from '@gd/charts/ICharts';
import {deepCopy} from '@utils/helpers';
import {
  plotTypes,
  modes,
  markers,
  colorScales,
  sizeModes
} from '@gd/charts/plotlyUtils';
import {Mode} from './ChartSelector';
import {
  CheckBoxRow,
  ColorPickerRow,
  SelectorRow,
  NoNullSelectorRow,
  NumberRow,
  FontRows,
  StringRow,
  NullableNumberRow
} from './SettingRows';

type PPlotMarker = Partial<PlotMarker> | undefined;

export const DataVisualization = React.memo(
  (props: {
    setMode: (mode: Mode) => void;
    data: IPlotData;
    setData: (data: IPlotData) => void;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {setMode, data, setData} = props;

    const apply = <T,>(func: (prev: IPlotData, newValue: T) => void) => {
      return (value: T) => {
        const newData = {...data};
        func(newData, value);
        setData(newData);
      };
    };

    return (
      <TableContainer>
        <Typography variant="h6" sx={{pt: 1, pl: 1}}>
          Data Visualization
        </Typography>
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
            <NoNullSelectorRow
              name="plot type"
              selection={plotTypes}
              value={data.type}
              onChange={apply((prev, value) => {
                prev.type = value;
              })}
            />
            <StringRow
              name="name"
              value={data.name}
              setValue={apply((prev, value) => {
                prev.name = value;
              })}
            />
            <NoNullSelectorRow
              name="x axis"
              selection={axesSet.x}
              value={data.xaxis}
              onChange={apply((prev, value) => {
                prev.xaxis = value;
              })}
            />
            <NoNullSelectorRow
              name="y axis"
              selection={axesSet.y}
              value={data.yaxis}
              onChange={apply((prev, value) => {
                prev.yaxis = value;
              })}
            />
            <NoNullSelectorRow
              name="mode"
              selection={modes}
              value={data.mode ?? 'lines'}
              onChange={apply((prev, value) => {
                prev.mode = value;
              })}
            />
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
);

const MarkerRows = React.memo(
  (props: {data: IPlotData; setData: (data: IPlotData) => void}) => {
    const {data, setData} = props;

    const apply = <T,>(
      func: (prev: Partial<PlotMarker>, newValue: T) => void
    ) => {
      return (value: T) => {
        const newData = {...data};
        func(newData.marker ?? {}, value);
        setData(newData);
      };
    };

    return (
      <>
        <NoNullSelectorRow
          name="marker symbol"
          selection={markers}
          value={data.marker?.symbol ?? 'circle'}
          onChange={apply((prev, value) => {
            prev.symbol = value;
          })}
        />
        <ColorPickerRow
          name="marker color"
          color={(data.marker?.color as string | undefined) ?? '#444444'}
          onChange={apply((prev, c) => {
            prev.color = c;
          })}
        />
        <SelectorRow
          name="marker color scale"
          selection={colorScales}
          value={(data.marker as PPlotMarker)?.colorscale}
          onChange={apply((prev, value) => {
            prev.colorscale = value;
          })}
        />
        <CheckBoxRow
          name="marker color show scale"
          value={(data.marker as PPlotMarker)?.showscale ?? false}
          setValue={apply((prev, value) => {
            prev.showscale = value;
          })}
        />
        <CheckBoxRow
          name="marker color scale reverse"
          value={(data.marker as PPlotMarker)?.reversescale ?? false}
          setValue={apply((prev, value) => {
            prev.reversescale = value;
          })}
        />
        <NullableNumberRow
          name="marker opacity"
          min={0}
          max={1}
          value={(data.marker as PPlotMarker)?.opacity as number}
          setValue={apply((prev, value) => {
            prev.opacity = value;
          })}
        />
        <NullableNumberRow
          name="marker size"
          min={0}
          value={(data.marker as PPlotMarker)?.size as number}
          setValue={apply((prev, value) => {
            prev.size = value;
          })}
        />
        <NumberRow
          name="marker max displayed (0 corresponds to no limit)"
          min={0}
          value={(data.marker as PPlotMarker)?.maxdisplayed ?? 0}
          setValue={apply((prev, value) => {
            prev.maxdisplayed = value;
          })}
        />
        <SelectorRow
          name="marker size mode"
          selection={sizeModes}
          value={(data.marker as PPlotMarker)?.sizemode}
          onChange={apply((prev, value) => {
            prev.sizemode = value;
          })}
        />
      </>
    );
  }
);
