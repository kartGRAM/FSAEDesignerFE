import * as React from 'react';
import {IChartLayout} from '@gd/charts/ICharts';
import {PlotType} from 'plotly.js';
import {
  Box,
  Divider,
  FormControl,
  Select,
  OutlinedInput,
  MenuItem
} from '@mui/material';
import store from '@store/store';
import {plotTypes} from '@gd/charts/plotlyUtils';

export type Mode =
  | 'DataSelect'
  | 'XAxis'
  | 'YAxis'
  | 'ZAxis'
  | 'DataVisualization';

export function ChartSelector(props: {
  mode: Mode;
  type: PlotType | 'composite';
  setPlotTypeAll: (type: PlotType) => void;
  dataSelector: JSX.Element;
  setLayout: (layout: IChartLayout) => void;
}) {
  const {mode} = props;
  if (mode === 'DataSelect') {
    return <DataSelectorMode {...props} />;
  }
  return null;
}

const DataSelectorMode = React.memo(
  (props: {
    type: PlotType | 'composite';
    setPlotTypeAll: (type: PlotType) => void;
    dataSelector: JSX.Element;
  }) => {
    const {setPlotTypeAll, type, dataSelector} = props;
    const {uitgd} = store.getState();
    const menuZIndex =
      uitgd.fullScreenZIndex + uitgd.dialogZIndex + uitgd.menuZIndex;
    return (
      <Box component="div">
        <FormControl size="small">
          <Select
            value={type}
            onChange={(e) => setPlotTypeAll(e.target.value as PlotType)}
            sx={{
              ml: 0,
              '& legend': {display: 'none'},
              '& fieldset': {top: 0},
              width: 200
            }}
            input={<OutlinedInput />}
            renderValue={(selected) => {
              if (selected.length === 0) {
                return <em>Select a tool type</em>;
              }
              return selected;
            }}
            MenuProps={{
              sx: {zIndex: menuZIndex}
            }}
          >
            {plotTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider />
        {dataSelector}
      </Box>
    );
  }
);
