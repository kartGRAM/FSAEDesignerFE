import * as React from 'react';
import {PlotData} from 'plotly.js';
import {IChartLayout} from '@gd/charts/ICharts';
import Plot, {PlotParams} from 'react-plotly.js';
import Box, {BoxProps} from '@mui/material/Box';
import {IconButton, Divider, Toolbar} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@gdComponents/Drawer';

type PlotParamsOmit = Omit<PlotParams, 'data' | 'layout'>;
type BoxPropsOmit = Omit<
  BoxProps,
  'onClick' | 'onDoubleClick' | 'onError' | 'ref'
>;

export interface ChartProps extends BoxPropsOmit, PlotParamsOmit {
  data?: Partial<PlotData>[];
  layout?: IChartLayout;
  dataSelector?: React.ReactNode;
}

export function Chart(props: ChartProps): React.ReactElement {
  const {layout, data, dataSelector} = props;
  const pLayout = JSON.parse(JSON.stringify(layout)) as IChartLayout;
  if (pLayout) {
    pLayout.autosize = true;
    if (!pLayout.margin) {
      pLayout.margin = {t: 24, b: 0, l: 0, r: 0};
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [open, setOpen] = React.useState<boolean>(true);
  const handleDrawerClose = React.useCallback(() => setOpen(false), []);
  const handleDrawerOpen = React.useCallback(() => setOpen(true), []);

  return (
    <Box
      component="div"
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        p: 0,
        pl: 1,
        pr: 1,
        m: 0,
        display: 'flex',
        flexDirection: 'row'
      }}
      draggable={false}
    >
      <Drawer open>
        <Box
          component="div"
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}
        >
          <IconButton onClick={handleDrawerClose}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
        <Divider />
        {dataSelector}
      </Drawer>
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          position: 'relative'
        }}
      >
        <Toolbar
          sx={{
            minHeight: '36px!important',
            justifyContent: 'flex-start',
            p: '0px!important'
          }}
        >
          <IconButton onClick={handleDrawerOpen}>
            <MenuIcon fontSize="small" />
          </IconButton>
        </Toolbar>
        <Box
          {...props}
          onClick={undefined}
          onDoubleClick={undefined}
          onError={undefined}
          component="div"
        >
          <Plot
            {...props}
            data={data ?? []}
            layout={pLayout}
            useResizeHandler
            style={{width: '100%', height: '100%'}}
          />
        </Box>
      </Box>
    </Box>
  );
}
