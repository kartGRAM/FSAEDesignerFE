/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import {PlotData, PlotType, LayoutAxis, AxisName} from 'plotly.js';
import {
  IChartLayout,
  SubPlot,
  subplots,
  defaultLayoutAxis
} from '@gd/charts/ICharts';
import Plot, {PlotParams} from 'react-plotly.js';
import * as Plotly from 'plotly.js';
import Box, {BoxProps} from '@mui/material/Box';
import {IconButton, Divider} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Drawer from '@gdComponents/Drawer';
import useUpdate from '@hooks/useUpdate';
import useUpdateEffect from '@hooks/useUpdateEffect';
import {alpha} from '@mui/material/styles';
import {numberToRgb} from '@app/utils/helpers';
import {useSelector, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {setChartSettingPanelWidth} from '@store/reducers/uiGeometryDesigner';
import $ from 'jquery';
import 'jqueryui';
import usePrevious from '@hooks/usePrevious';

import {ChartSelector, Mode} from './ChartSelector';

type PlotParamsOmit = Omit<PlotParams, 'data' | 'layout'>;
type BoxPropsOmit = Omit<
  BoxProps,
  'onClick' | 'onDoubleClick' | 'onError' | 'ref'
>;

export interface ChartProps extends BoxPropsOmit, PlotParamsOmit {
  data?: Partial<PlotData>[];
  layout: IChartLayout;
  dataSelector: JSX.Element;
  setLayout: (layout: IChartLayout) => void;

  type: PlotType | 'composite';
  setPlotTypeAll: (type: PlotType) => void;
}

export function Chart(props: ChartProps): React.ReactElement {
  const {layout, data, dataSelector, setLayout, type, setPlotTypeAll} = props;
  const pLayout = JSON.parse(JSON.stringify(layout)) as IChartLayout;
  const update = useUpdate();
  const revision = React.useRef(0);
  const dblClick = React.useRef(0);
  const dblClickTimeout = React.useRef<NodeJS.Timer>(null!);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const dividerRef = React.useRef<HTMLHRElement>(null);

  pLayout.autosize = true;
  pLayout.datarevision = revision.current++;
  if (!pLayout.margin) {
    pLayout.margin = {t: 24};
  }

  (data ?? []).forEach((d) => {
    const xaxisNumber = d.xaxis?.slice(1) ?? '1';
    const yaxisNumber = d.yaxis?.slice(1) ?? '1';
    const axisNumbers = [xaxisNumber, yaxisNumber];
    const params = [
      `xaxis${xaxisNumber !== '1' ? xaxisNumber : ''}`,
      `yaxis${yaxisNumber !== '1' ? yaxisNumber : ''}`
    ];
    const axes: AxisName[] = ['x', 'y'];
    params.forEach((param, i) => {
      if (!(pLayout as any)[param]) {
        const layout: Partial<LayoutAxis> = {
          ...defaultLayoutAxis,
          title: param,
          overlaying: axisNumbers[i] !== '1' ? axes[i] : undefined,
          side: axisNumbers[i] !== '1' ? 'right' : undefined
        };
        (pLayout as any)[param] = layout;
      }
    });
  });

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
  const widthOnClosed = 60;
  const [open, setOpen] = React.useState<boolean>(
    uigd.present.chartState?.settingPanelDefaultOpen ?? false
  );
  const openPrevious = usePrevious(open);
  const [panelWidth, setPanelWidth] = React.useState<string>(
    uigd.present.chartState?.settingPanelWidth ?? '30%'
  );

  const [mode, setMode] = React.useState<Mode>('DataSelect');
  const [subplotTarget, setSubplotTarget] = React.useState<SubPlot>('xy');

  React.useEffect(() => {
    const resize = (e: any, ui: any) => {
      if (!open) return;
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
      if (!open) return;
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
        disabled: !open,
        containment: 'parent',
        scroll: false,
        axis: 'x',
        drag: resize,
        stop: resizeEnd
      });
    }
  }, [dispatch, open]);

  const id = React.useId();
  const handleBackgroundDoubleClick = React.useCallback(
    (subplot: SubPlot) => {
      // なぜかdblClickが反応しないため、適当にごまかす
      if (dblClick.current) {
        setSubplotTarget(subplot);
        setOpen(() => true);
        setMode('SubPlotSettings');
        dblClick.current = 0;
        clearTimeout(dblClickTimeout.current);
      } else {
        dblClick.current = performance.now();
        dblClickTimeout.current = setTimeout(() => {
          dblClick.current = 0;
          if (mode === 'SubPlotSettings') setMode('DataSelect');
        }, 200);
      }
    },
    [mode]
  );

  const handlePointsClick = (e: Readonly<Plotly.PlotMouseEvent>) => {
    console.log(e);
  };

  useUpdateEffect(() => {
    const box = document.getElementById(id);
    const funcs: {[index: string]: () => void} = {};
    subplots.forEach((subplot) => {
      const gElement = box?.getElementsByClassName(subplot)[0];
      const rect = gElement?.getElementsByClassName('nsewdrag')[0];
      if (rect) {
        funcs[subplot] = () => handleBackgroundDoubleClick(subplot);
        rect.addEventListener('click', funcs[subplot], true);
      }
    });
    return () => {
      subplots.forEach((subplot) => {
        const gElement = box?.getElementsByClassName(subplot)[0];
        const rect = gElement?.getElementsByClassName('nsewdrag')[0];
        if (rect) {
          rect.removeEventListener('click', funcs[subplot], true);
        }
      });
    };
  });

  const transitionSX =
    open && openPrevious
      ? {
          position: 'absolute',
          left: `${panelWidth}`,
          transition: 'background-color 0.15s ease 0s, width 0.15s ease 0s',
          '&:hover': {
            width: '4px',
            backgroundColor: numberToRgb(enabledColorLight)
          },
          '&:active': {
            cursor: 'col-resize',
            width: '4px',
            backgroundColor: numberToRgb(enabledColorLight)
          }
        }
      : {};

  dividerRef.current?.removeAttribute('style');

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
        onTransitionEnd={(e) => {
          if (e.target !== drawerRef.current) return;
          update();
        }}
        sx={{
          pl: 1,
          '& .MuiPaper-root': {
            borderRight: 'unset',
            overflowY: 'scroll',
            '&::-webkit-scrollbar': {
              width: '10px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(numberToRgb(enabledColorLight), 0.7),
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
          <ChartSelector
            type={type}
            setPlotTypeAll={setPlotTypeAll}
            subplotTarget={subplotTarget}
            mode={mode}
            dataSelector={dataSelector}
            layout={pLayout}
            setLayout={setLayout}
          />
        </Box>
      </Drawer>
      <Divider
        orientation="vertical"
        flexItem
        draggable={open}
        ref={dividerRef}
        sx={{
          ...transitionSX,
          height: '100%',
          width: '2px',
          zIndex,
          backgroundColor: alpha('#000000', 0.3),
          borderColor: alpha('#000000', 0),
          cursor: 'col-resize'
        }}
      />
      <Box
        component="div"
        sx={{
          pr: 1,
          flexGrow: 1,
          position: 'relative',
          height: '100%',
          minWidth: '0px' // minWidthを指定しないとFlexBoxがうまく動かない
        }}
      >
        <Box
          {...{data: {}, ...props}}
          onClick={undefined}
          onDoubleClick={undefined}
          onError={undefined}
          component="div"
          id={id}
        >
          <Plot
            {...props}
            data={data ?? []}
            layout={pLayout}
            useResizeHandler
            style={{width: '100%', height: '100%'}}
            onInitialized={update}
            onClick={handlePointsClick}
          />
        </Box>
      </Box>
    </Box>
  );
}
