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
import {PlotMarker, ScatterLine, ScatterMarkerLine} from 'plotly.js';
import {IPlotData, axesSet} from '@gd/charts/ICharts';
import {deepCopy} from '@utils/helpers';
import {
  plotTypes,
  modes,
  markers,
  colorScales,
  sizeModes,
  dashes,
  lineShapes,
  histFuncs,
  histNorms,
  hoverOns,
  hoverInfo,
  hoverLabelAligns,
  textInfo,
  textPositions,
  insideTextAnchors,
  constrainTexts,
  fills
} from '@gd/charts/plotlyUtils';
import {Mode} from './ChartSelector';
import {
  CheckBoxRow,
  ColorPickerRow,
  NullableColorPickerRow,
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
            {data.mode?.includes('markers') ? (
              <MarkerRows data={data} setData={setData} />
            ) : null}
            {data.mode?.includes('markers') ? (
              <MarkerLineRows data={data} setData={setData} />
            ) : null}
            {data.mode?.includes('lines') ? (
              <LineRows data={data} setData={setData} />
            ) : null}
            <SelectorRow
              name="hist func"
              selection={histFuncs}
              value={data.histfunc}
              onChange={apply((prev, value) => {
                prev.histfunc = value;
              })}
            />
            <SelectorRow
              name="hist norm"
              selection={histNorms}
              value={data.histnorm}
              onChange={apply((prev, value) => {
                prev.histnorm = value;
              })}
            />
            <SelectorRow
              name="hover on"
              selection={hoverOns}
              value={data.hoveron}
              onChange={apply((prev, value) => {
                prev.hoveron = value;
              })}
            />
            <SelectorRow
              name="hover info"
              selection={hoverInfo}
              value={data.hoverinfo}
              onChange={apply((prev, value) => {
                prev.hoverinfo = value;
              })}
            />
            <NullableColorPickerRow
              name="hover label bgcolor"
              color={data.hoverlabel?.bgcolor}
              onChange={apply((prev, c) => {
                if (!prev.hoverlabel) prev.hoverlabel = {};
                prev.hoverlabel.bgcolor = c;
              })}
            />
            <NullableColorPickerRow
              name="hover label border color"
              color={data.hoverlabel?.bordercolor}
              onChange={apply((prev, c) => {
                if (!prev.hoverlabel) prev.hoverlabel = {};
                prev.hoverlabel.bordercolor = c;
              })}
            />
            <FontRows
              name="hover label font"
              font={data.hoverlabel?.font}
              setValue={apply((prev, value) => {
                if (!prev.hoverlabel) prev.hoverlabel = {};
                prev.hoverlabel.font = value;
              })}
            />
            <SelectorRow
              name="hover label align"
              selection={hoverLabelAligns}
              value={data.hoverlabel?.align}
              onChange={apply((prev, value) => {
                if (!prev.hoverlabel) prev.hoverlabel = {};
                prev.hoverlabel.align = value;
              })}
            />
            <NumberRow
              name="hover label name length"
              min={-1}
              integer
              value={data.hoverlabel?.namelength ?? 15}
              setValue={apply((prev, value) => {
                if (!prev.hoverlabel) prev.hoverlabel = {};
                prev.hoverlabel.namelength = value;
              })}
            />
            <StringRow
              name="hover template"
              value={data.hovertemplate as string | undefined}
              setValue={apply((prev, value) => {
                prev.hovertemplate = value;
              })}
            />
            <StringRow
              name="hover text"
              value={data.hovertext as string | undefined}
              setValue={apply((prev, value) => {
                prev.hovertext = value;
              })}
            />
            <StringRow
              name="x hover format"
              value={data.xhoverformat as string | undefined}
              setValue={apply((prev, value) => {
                prev.xhoverformat = value;
              })}
            />
            <StringRow
              name="y hover format"
              value={data.yhoverformat as string | undefined}
              setValue={apply((prev, value) => {
                prev.yhoverformat = value;
              })}
            />
            <StringRow
              name="z hover format"
              value={data.zhoverformat as string | undefined}
              setValue={apply((prev, value) => {
                prev.zhoverformat = value;
              })}
            />
            <StringRow
              name="text template"
              value={data.texttemplate as string | undefined}
              setValue={apply((prev, value) => {
                prev.texttemplate = value;
              })}
            />
            <SelectorRow
              name="text info"
              selection={textInfo}
              value={data.textinfo}
              onChange={apply((prev, value) => {
                prev.textinfo = value;
              })}
            />
            <SelectorRow
              name="text position"
              selection={textPositions}
              value={data.textposition}
              onChange={apply((prev, value) => {
                prev.textposition = value;
              })}
            />
            <FontRows
              name="text font"
              font={data.textfont}
              setValue={apply((prev, value) => {
                prev.textfont = value;
              })}
            />
            <NullableNumberRow
              name="text angle"
              value={data.textangle as number}
              setValue={apply((prev, value) => {
                prev.textangle = value;
              })}
            />
            <SelectorRow
              name="inside text anchor"
              selection={insideTextAnchors}
              value={data.insidetextanchor}
              onChange={apply((prev, value) => {
                prev.insidetextanchor = value;
              })}
            />
            <SelectorRow
              name="constraint text"
              selection={constrainTexts}
              value={data.constraintext}
              onChange={apply((prev, value) => {
                prev.constraintext = value;
              })}
            />
            <SelectorRow
              name="fill"
              selection={fills}
              value={data.fill}
              onChange={apply((prev, value) => {
                prev.fill = value;
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
        if (!newData.marker) newData.marker = {};
        func(newData.marker, value);
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
        <NullableColorPickerRow
          name="marker color"
          color={data.marker?.color as string | undefined}
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
          value={((data.marker as PPlotMarker)?.opacity as number) ?? 1}
          setValue={apply((prev, value) => {
            prev.opacity = value;
          })}
        />
        <NullableNumberRow
          name="marker size"
          min={0}
          value={((data.marker as PPlotMarker)?.size as number) ?? 6}
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

const LineRows = React.memo(
  (props: {data: IPlotData; setData: (data: IPlotData) => void}) => {
    const {data, setData} = props;

    const apply = <T,>(
      func: (prev: Partial<ScatterLine>, newValue: T) => void
    ) => {
      return (value: T) => {
        const newData = {...data};
        if (!newData.line) newData.line = {};
        func(newData.line, value);
        setData(newData);
      };
    };

    return (
      <>
        <NullableColorPickerRow
          name="line color"
          color={data.line?.color as string | undefined}
          onChange={apply((prev, c) => {
            prev.color = c;
          })}
        />
        <NullableNumberRow
          name="line width"
          min={0}
          max={50}
          value={data.line?.width ?? 2}
          setValue={apply((prev, value) => {
            prev.width = value;
          })}
        />
        <SelectorRow
          name="line dash type"
          selection={dashes}
          value={data.line?.dash ?? 'solid'}
          onChange={apply((prev, value) => {
            prev.dash = value;
          })}
        />
        <SelectorRow
          name="line shape"
          selection={lineShapes}
          value={data.line?.shape ?? 'linear'}
          onChange={apply((prev, value) => {
            prev.shape = value;
          })}
        />
        <NullableNumberRow
          name="line smoothing"
          min={0}
          max={1.3}
          value={data.line?.smoothing ?? 1.0}
          setValue={apply((prev, value) => {
            prev.smoothing = value;
          })}
        />

        <CheckBoxRow
          name="line simplify"
          value={data.line?.simplify ?? true}
          setValue={apply((prev, value) => {
            prev.simplify = value;
          })}
        />
      </>
    );
  }
);

const MarkerLineRows = React.memo(
  (props: {data: IPlotData; setData: (data: IPlotData) => void}) => {
    const {data, setData} = props;

    const apply = <T,>(
      func: (prev: Partial<ScatterMarkerLine>, newValue: T) => void
    ) => {
      return (value: T) => {
        const newData = {...data};
        if (!newData.marker) newData.marker = {};
        if (!newData.marker.line) newData.marker.line = {};
        func(newData.marker.line, value);
        setData(newData);
      };
    };
    const line = (data.marker as PPlotMarker)?.line;

    return (
      <>
        <NullableNumberRow
          name="marker line width"
          min={0}
          value={line?.width as number | undefined}
          setValue={apply((prev, value) => {
            prev.width = value;
          })}
        />
        <NullableColorPickerRow
          name="marker line color"
          color={line?.color as string | undefined}
          onChange={apply((prev, c) => {
            prev.color = c;
          })}
        />
        <SelectorRow
          name="marker line color scale"
          selection={colorScales}
          value={line?.colorscale}
          onChange={apply((prev, value) => {
            prev.colorscale = value;
          })}
        />
        <CheckBoxRow
          name="marker line color scale reverse"
          value={line?.reversescale ?? false}
          setValue={apply((prev, value) => {
            prev.reversescale = value;
          })}
        />
      </>
    );
  }
);
