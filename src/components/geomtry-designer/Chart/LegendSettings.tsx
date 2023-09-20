import * as React from 'react';
import {IChartLayout} from '@gd/charts/ICharts';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography
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
  legendTitleSides
} from '@gd/charts/plotlyUtils';
import {Mode} from './ChartSelector';
import {
  ColorPickerRow,
  SelectorRow,
  NumberRow,
  FontRows,
  StringRow,
  NullableNumberRow
} from './SettingRows';

export const LegendSettings = React.memo(
  (props: {
    setMode: (mode: Mode) => void;
    layout: IChartLayout;
    setLayout: (layout: IChartLayout) => void;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {setMode, layout, setLayout} = props;
    const {legend} = layout;

    return (
      <TableContainer>
        <Typography variant="h6" sx={{pt: 1, pl: 1}}>
          Legend Settings
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
            <ColorPickerRow
              name="background color"
              color={(legend?.bgcolor as string | undefined) ?? '#FFFFFF'}
              onChange={(c) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.bgcolor = c;
                setLayout(newLayout);
              }}
            />
            <ColorPickerRow
              name="boader color"
              color={(legend?.bordercolor as string | undefined) ?? '#FFFFFF'}
              onChange={(c) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.bordercolor = c;
                setLayout(newLayout);
              }}
            />
            <FontRows
              name="legend font"
              font={legend?.font}
              setValue={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.font = value;
                setLayout(newLayout);
              }}
            />
            <NumberRow
              name="border width"
              value={legend?.borderwidth ?? 0}
              min={0}
              setValue={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.borderwidth = value;
                setLayout(newLayout);
              }}
            />
            <SelectorRow
              name="group click"
              selection={groupClicks}
              value={legend?.groupclick}
              onChange={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.groupclick = value;
                setLayout(newLayout);
              }}
            />
            <FontRows
              name="group title font"
              font={legend?.grouptitlefont}
              setValue={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.grouptitlefont = value;
                setLayout(newLayout);
              }}
            />
            <SelectorRow
              name="item click"
              selection={itemClicks}
              value={legend?.itemclick}
              onChange={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.itemclick = value;
                setLayout(newLayout);
              }}
            />
            <SelectorRow
              name="item sizing"
              selection={itemSizings}
              value={legend?.itemsizing}
              onChange={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.itemsizing = value;
                setLayout(newLayout);
              }}
            />
            <NumberRow
              name="item width"
              value={legend?.itemwidth ?? 20}
              min={0}
              setValue={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.itemwidth = value;
                setLayout(newLayout);
              }}
            />
            <SelectorRow
              name="orientation"
              selection={orientations}
              value={legend?.orientation}
              onChange={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.orientation = value;
                setLayout(newLayout);
              }}
            />
            <FontRows
              name="legend Title font"
              font={legend?.title?.font}
              setValue={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.title = newLayout.legend.title ?? {};
                newLayout.legend.title.font = value;
                setLayout(newLayout);
              }}
            />
            <SelectorRow
              name="legend title side"
              selection={legendTitleSides}
              value={legend?.title?.side}
              onChange={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.title = newLayout.legend.title ?? {};
                newLayout.legend.title.side = value;
                setLayout(newLayout);
              }}
            />
            <StringRow
              name="legend title text"
              value={legend?.title?.text}
              setValue={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.title = newLayout.legend.title ?? {};
                newLayout.legend.title.text = value;
                setLayout(newLayout);
              }}
            />
            <NumberRow
              name="trace group gap"
              value={legend?.tracegroupgap ?? 10}
              min={0}
              setValue={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.tracegroupgap = value;
                setLayout(newLayout);
              }}
            />
            <SelectorRow
              name="trace order"
              selection={traceOrders}
              value={legend?.traceorder}
              onChange={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.traceorder = value;
                setLayout(newLayout);
              }}
            />
            <SelectorRow
              name="vertical align"
              selection={vAligns}
              value={legend?.valign}
              onChange={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.valign = value;
                setLayout(newLayout);
              }}
            />
            <NullableNumberRow
              name="x position"
              value={legend?.x}
              setValue={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.x = value;
                setLayout(newLayout);
              }}
            />
            <SelectorRow
              name="x anchor"
              selection={xAnchors}
              value={legend?.xanchor}
              onChange={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.xanchor = value;
                setLayout(newLayout);
              }}
            />
            <NullableNumberRow
              name="y position"
              value={legend?.y}
              setValue={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.y = value;
                setLayout(newLayout);
              }}
            />
            <SelectorRow
              name="y anchor"
              selection={yAnchors}
              value={legend?.yanchor}
              onChange={(value) => {
                const newLayout = deepCopy(layout);
                newLayout.legend = newLayout.legend ?? {};
                newLayout.legend.yanchor = value;
                setLayout(newLayout);
              }}
            />
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
);
