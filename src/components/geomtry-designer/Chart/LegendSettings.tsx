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
import {groupClicks, itemClicks, itemSizings} from '@gd/charts/plotlyUtils';
import {Mode} from './ChartSelector';
import {ColorPickerRow, SelectorRow, NumberRow} from './SettingRows';

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
                newLayout.legend.bgcolor = c;
                setLayout(newLayout);
              }}
            />
            {
              // Font
            }
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
            {
              // grouptitlefont
            }
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
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
);
