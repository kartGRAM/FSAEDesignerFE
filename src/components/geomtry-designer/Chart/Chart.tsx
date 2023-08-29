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
import {useSelector, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {setChartSettingPanelWidth} from '@store/reducers/uiGeometryDesigner';
import $ from 'jquery';
import 'jqueryui';

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
  const boxRef = React.useRef<HTMLDivElement>(null);
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const dividerRef = React.useRef<HTMLHRElement>(null);

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

  const handleDrawerToggle = React.useCallback(
    () => setOpen((prev) => !prev),
    []
  );
  const dispatch = useDispatch();

  const {uitgd, uigd} = store.getState();
  const zIndex = uitgd.fullScreenZIndex + uitgd.menuZIndex;
  const widthOnClosed = 48;
  const [open, setOpen] = React.useState<boolean>(
    uigd.present.chartState?.settingPanelDefaultOpen ?? false
  );
  const [panelWidth, setPanelWidth] = React.useState<string>(
    uigd.present.chartState?.settingPanelWidth ?? '30%'
  );

  React.useEffect(() => {
    const resize = (e: any, ui: any) => {
      const boxWidth = boxRef.current?.getBoundingClientRect()?.width ?? 1000;
      if (ui.position.left < widthOnClosed) {
        ui.position.left = widthOnClosed;
      }
      if (ui.position.left > boxWidth) {
        ui.position.left = boxWidth;
      }
      if (drawerRef.current) {
        drawerRef.current.style.width = `${
          (ui.position.left / boxWidth) * 100
        }%`;

        drawerRef.current.style.transition = 'unset';
      }
    };
    const resizeEnd = () => {
      if (drawerRef.current) {
        const width = `${drawerRef.current.style.width}`;
        setPanelWidth(width);
        dispatch(setChartSettingPanelWidth(width));

        drawerRef.current.removeAttribute('style');
      }
      if (dividerRef.current) {
        dividerRef.current.removeAttribute('style');
      }
    };

    if (dividerRef.current) {
      $(dividerRef.current).draggable({
        containment: 'parent',
        scroll: false,
        axis: 'x',
        drag: resize,
        stop: resizeEnd
      });
    }
  }, []);

  return (
    <Box
      component="div"
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        p: 0,
        m: 0,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'left'
      }}
      ref={boxRef}
    >
      <Drawer
        open={open}
        variant="permanent"
        widthOnOpen={panelWidth}
        widthOnClose={widthOnClosed}
        onAnimationEnd={update}
        sx={{
          '& .MuiPaper-root': {
            borderRight: 'unset',
            overflowY: 'scroll',
            '&::-webkit-scrollbar': {
              width: '10px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(numberToRgb(enabledColorLight), 1),
              borderRadius: '5px'
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: numberToRgb(0xffffff)
            }
          }
        }}
        ref={drawerRef}
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

      <Divider
        orientation="vertical"
        flexItem
        draggable={open}
        ref={dividerRef}
        sx={{
          position: 'absolute',
          height: '100%',
          left: `${panelWidth}`,
          width: '4px',
          zIndex,
          backgroundColor: 'transparent',
          borderColor: alpha('#000000', 0),
          cursor: 'col-resize',

          transition: 'background-color 0.15s ease 0s',
          '&:hover': {
            backgroundColor: numberToRgb(enabledColorLight)
          },
          '&:active': {
            cursor: 'col-resize',
            backgroundColor: numberToRgb(enabledColorLight)
          }
        }}
      />
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
