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
import {IPlotData, axesSet} from '@gd/charts/ICharts';
import {deepCopy} from '@utils/helpers';
import {plotTypes, modes} from '@gd/charts/plotlyUtils';
import {Mode} from './ChartSelector';
import {
  ColorPickerRow,
  SelectorRow,
  NoNullSelectorRow,
  NumberRow,
  FontRows,
  StringRow,
  NullableNumberRow
} from './SettingRows';

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
