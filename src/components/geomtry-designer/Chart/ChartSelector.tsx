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
  InputLabel,
  Typography
} from '@mui/material';
import store from '@store/store';
import {plotTypes} from '@gd/charts/plotlyUtils';
import {SubPlotSettings} from './SubPlotSettings';
import {LegendSettings} from './LegendSettings';
import {LayoutAxisSettings} from './AxisSettings';

export type Mode =
  | 'DataSelect'
  | 'SubPlotSettings'
  | 'AxisSettings'
  | 'LegendSettings'
  | 'DataVisualization';

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
    targetAxis: string;
    setTargetAxis: (axis: string) => void;
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
      axes,
      targetAxis,
      setTargetAxis
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
          setTargetAxis={setTargetAxis}
        />
      );
    }
    if (mode === 'LegendSettings') {
      return (
        <LegendSettings
          setMode={setMode}
          layout={layout}
          setLayout={setLayout}
        />
      );
    }
    if (mode === 'AxisSettings' && axes.includes(targetAxis)) {
      return (
        <LayoutAxisSettings
          setMode={setMode}
          layout={layout}
          setLayout={setLayout}
          axis={targetAxis}
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
        <Typography variant="h6" sx={{pt: 1, pl: 1}}>
          Data Selector
        </Typography>
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
