import * as React from 'react';
import {PlotData} from 'plotly.js';
import {IChartLayout} from '@gd/charts/ICharts';
import Plot, {PlotParams} from 'react-plotly.js';
import Box, {BoxProps} from '@mui/material/Box';
import {IconButton, Divider} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Drawer from '@gdComponents/Drawer';
import useUpdate from '@hooks/useUpdate';
import {alpha} from '@mui/material/styles';
import {numberToRgb} from '@app/utils/helpers';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';

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
  const update = useUpdate();
  const revision = React.useRef(0);
  if (pLayout) {
    pLayout.autosize = true;
    pLayout.datarevision = revision.current++;
    if (!pLayout.margin) {
      pLayout.margin = {t: 24, b: 0, l: 0, r: 0};
    }
  }

  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.present.enabledColorLight
  );

  const [open, setOpen] = React.useState<boolean>(true);
  const handleDrawerToggle = React.useCallback(
    () => setOpen((prev) => !prev),
    []
  );

  const widthOnClosed = 40;

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
    >
      <Drawer
        open={open}
        variant="permanent"
        widthOnOpen="30%"
        widthOnClose={widthOnClosed}
        onAnimationEnd={update}
        sx={{
          '& .MuiPaper-root': {
            borderRight: 'unset'
          },
          overflowY: 'scroll',
          '&::-webkit-scrollbar': {
            width: '10px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(numberToRgb(enabledColorLight), 0.3),
            borderRadius: '5px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: numberToRgb(0xffffff)
          }
        }}
      >
        <Box
          component="div"
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}
        >
          <IconButton onClick={handleDrawerToggle}>
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Box>
        <Divider />
        <Box component="div" sx={{display: open ? undefined : 'none'}}>
          {dataSelector}
        </Box>
      </Drawer>
      <Box
        {...{data: {}, ...props}}
        onClick={undefined}
        onDoubleClick={undefined}
        onError={undefined}
        component="div"
        id="chartContainer"
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
  );
}
