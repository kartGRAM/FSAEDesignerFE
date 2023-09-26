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
import {IPlotData} from '@gd/charts/ICharts';
import {deepCopy} from '@utils/helpers';
import {groupClicks} from '@gd/charts/plotlyUtils';
import {Mode} from './ChartSelector';
import {
  ColorPickerRow,
  SelectorRow,
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
          <TableBody>aaa</TableBody>
        </Table>
      </TableContainer>
    );
  }
);
