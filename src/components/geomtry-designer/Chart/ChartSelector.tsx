import * as React from 'react';
import {IChartLayout, SubPlot} from '@gd/charts/ICharts';
import {PlotType} from 'plotly.js';
import {
  Box,
  Divider,
  FormControl,
  Select,
  OutlinedInput,
  MenuItem,
  InputLabel
} from '@mui/material';
import store from '@store/store';
import {plotTypes} from '@gd/charts/plotlyUtils';
import {SubPlotSettings} from './SubPlotSettings';

export type Mode = 'DataSelect' | 'SubPlotSettings' | 'DataVisualization';

export const ChartSelector = React.memo(
  (props: {
    mode: Mode;
    setMode: (mode: Mode) => void;
    type: PlotType | 'composite';
    subplotTarget: SubPlot;
    setPlotTypeAll: (type: PlotType) => void;
    dataSelector: JSX.Element;
    layout: IChartLayout;
    setLayout: (layout: IChartLayout) => void;
    axes: string[];
  }) => {
    const {
      mode,
      setMode,
      type,
      setPlotTypeAll,
      dataSelector,
      subplotTarget,
      layout,
      setLayout,
      axes
    } = props;
    if (mode === 'DataSelect') {
      return (
        <DataSelectorMode
          type={type}
          setPlotTypeAll={setPlotTypeAll}
          dataSelector={dataSelector}
        />
      );
    }
    if (mode === 'SubPlotSettings') {
      return (
        <SubPlotSettings
          setMode={setMode}
          subplotTarget={subplotTarget}
          layout={layout}
          setLayout={setLayout}
          axes={axes}
        />
      );
    }
    return null;
  }
);

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
    const id = React.useId();
    return (
      <Box component="div">
        <Box component="div" sx={{pt: 2, pb: 1}}>
          <FormControl size="small" sx={{width: '100%', pr: 1}}>
            <InputLabel id={id}>Plot Type</InputLabel>
            <Select
              labelId={id}
              value={type}
              onChange={(e) => setPlotTypeAll(e.target.value as PlotType)}
              sx={{
                ml: 0,
                width: '100%'
              }}
              input={<OutlinedInput label="Plot Type" />}
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
        </Box>

        <Divider />
        {dataSelector}
      </Box>
    );
  }
);
