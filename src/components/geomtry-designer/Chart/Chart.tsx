import * as React from 'react';
import natsort from 'natsort';
import {PlotType, LayoutAxis} from 'plotly.js';
import {
  IChartLayout,
  SubPlot,
  subplots,
  defaultLayoutAxis,
  IPlotData
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
import {deepCopy} from '@utils/helpers';
import {Mode, ChartSelector} from './ChartSelector';

type PlotParamsOmit = Omit<PlotParams, 'data' | 'layout'>;
type BoxPropsOmit = Omit<
  BoxProps,
  'onClick' | 'onDoubleClick' | 'onError' | 'ref'
>;

export interface ChartProps extends BoxPropsOmit, PlotParamsOmit {
  data?: IPlotData[];
  setData: (data: IPlotData) => void;
  layout: IChartLayout;
  dataSelector: JSX.Element;
  setLayout: (layout: IChartLayout) => void;

  type: PlotType | 'composite';
  setPlotTypeAll: (type: PlotType) => void;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  targetDataIdx: number | undefined;
  setTargetDataIdx: React.Dispatch<React.SetStateAction<number | undefined>>;
}

export function Chart(props: ChartProps): React.ReactElement {
  const {layout, data, setData, dataSelector, setLayout, type, setPlotTypeAll} =
    props;
  const {mode, setMode, targetDataIdx, setTargetDataIdx} = props;
  const pLayout = deepCopy(layout);
  const update = useUpdate();
  const revision = React.useRef(0);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const paperRef = React.useRef<HTMLDivElement>(null);
  const dividerRef = React.useRef<HTMLHRElement>(null);

  pLayout.autosize = true;
  pLayout.datarevision = revision.current++;
  if (!pLayout.margin) {
    pLayout.margin = {t: 24};
  }

  // グラフの軸の設定
  const axes = new Set<string>();

  (data ?? []).forEach((d) => {
    const xaxisNumber = getAxisNumber(d.xaxis);
    const yaxisNumber = getAxisNumber(d.yaxis);
    const axisNumbers = {x: xaxisNumber, y: yaxisNumber};
    const params = {
      x: `xaxis${xaxisNumber !== '1' ? xaxisNumber : ''}`,
      y: `yaxis${yaxisNumber !== '1' ? yaxisNumber : ''}`
    };
    axes.add(params.x);
    axes.add(params.y);
    (Object.keys(params) as ('x' | 'y')[]).forEach((axis) => {
      if (!(pLayout as any)[params[axis]]) {
        // if (true) {
        const layout: Partial<LayoutAxis> = {
          ...defaultLayoutAxis,
          title: params[axis],
          overlaying: axisNumbers[axis] !== '1' ? axis : undefined,
          side:
            // eslint-disable-next-line no-nested-ternary
            axis === 'x'
              ? undefined
              : Number(axisNumbers[axis]) % 2 === 1
              ? 'left'
              : 'right'
        };
        (pLayout as any)[params[axis]] = layout;
      }
    });
  });

  // 軸の設定ここまで

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

  const afterPlotFuncsRef = React.useRef<(() => void)[]>([]);
  const afterPlot = React.useCallback(() => {
    const funcs = afterPlotFuncsRef.current;
    funcs.forEach((func) => func());
    afterPlotFuncsRef.current = [];
  }, []);

  const [targetAxis, setTargetAxis] = React.useState<string>('');
  const [subplotTarget, setSubplotTarget] = React.useState<SubPlot>('xy');

  React.useEffect(() => {
    paperRef.current?.scrollTo({top: 0, behavior: 'smooth'});
  }, [mode, targetAxis, subplotTarget]);

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
      // なぜかdblClickが反応しないため、clickのdetailを使う
      setSubplotTarget(subplot);
      setOpen(() => true);
      setMode('SubPlotSettings');
    },
    [setMode]
  );

  const handleAxisDoubleClick = React.useCallback(
    (axis: string) => {
      setOpen(() => true);
      setMode('AxisSettings');
      setTargetAxis(axis);
    },
    [setMode]
  );

  const preventBGClick = React.useRef<boolean>(false);
  const handleDataClick = React.useCallback(
    (e: Readonly<Plotly.PlotMouseEvent>) => {
      if (e.event.detail !== 2 || !e.points[0]) return;
      const tn = e.points[0].curveNumber;
      if (!data || !data[tn]) return;
      e.event.stopPropagation();
      e.event.stopImmediatePropagation();
      preventBGClick.current = true;
      setTimeout(() => {
        preventBGClick.current = false;
      }, 500);
      setTargetDataIdx(tn);
      setOpen(() => true);
      setMode('DataVisualization');
    },
    [data, setMode, setTargetDataIdx]
  );

  // SubplotSetting
  useUpdateEffect(() => {
    const box = document.getElementById(id);
    const funcs: {[index: string]: (e: Event) => void} = {};
    subplots.forEach((subplot) => {
      funcs[subplot] = (e: Event) => {
        if (preventBGClick.current) return;
        const e2 = e as MouseEvent;
        if (e2.detail === 2) handleBackgroundDoubleClick(subplot);
        else setMode('DataSelect');
      };
      const func = () => {
        const gElement = box?.getElementsByClassName(subplot)[0];
        const rect = gElement?.getElementsByClassName('nsewdrag')[0];
        if (rect) {
          rect.removeEventListener('click', funcs[subplot]);
          rect.addEventListener('click', funcs[subplot]);
        }
      };
      func();
      afterPlotFuncsRef.current.push(func);
    });
    return () => {
      subplots.forEach((subplot) => {
        const gElement = box?.getElementsByClassName(subplot)[0];
        const rect = gElement?.getElementsByClassName('nsewdrag')[0];
        if (rect) {
          rect.removeEventListener('click', funcs[subplot]);
        }
      });
    };
  });

  // axisSetting
  useUpdateEffect(() => {
    const box = document.getElementById(id);
    const funcs: {[index: string]: () => void} = {};
    axes.forEach((axis) => {
      funcs[axis] = () => handleAxisDoubleClick(axis);
      const func = () => {
        const name = `${axis.replace('axis', '')}title`;
        const items = box?.getElementsByClassName(name);
        if (items) {
          [...items].forEach((item) => {
            (item as HTMLElement).style.pointerEvents = 'all';
            (item as HTMLElement).style.cursor = 'pointer';
            item.removeEventListener('dblclick', funcs[axis], false);
            item.addEventListener('dblclick', funcs[axis], false);
          });
        }
      };
      func();
      afterPlotFuncsRef.current.push(func);
    });
    return () => {
      axes.forEach((axis) => {
        const name = `${axis.replace('axis', '')}title`;
        const items = box?.getElementsByClassName(name);
        if (items) {
          [...items].forEach((item) =>
            item.removeEventListener('dblclick', funcs[axis], false)
          );
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
        PaperProps={{
          ref: paperRef
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
            setMode={setMode}
            dataSelector={dataSelector}
            layout={pLayout}
            setLayout={setLayout}
            axes={[...axes].sort(natsort())}
            targetAxis={targetAxis}
            setTargetAxis={setTargetAxis}
            data={
              data && targetDataIdx !== undefined
                ? data[targetDataIdx]
                : undefined
            }
            setData={setData}
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
            onAfterPlot={afterPlot}
            onInitialized={update}
            onClick={handleDataClick}
            onLegendDoubleClick={() => {
              setMode('LegendSettings');
              return false;
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

const getAxisNumber = (axis?: string) => {
  const tmp = axis?.slice(1) ?? '1';
  return tmp !== '' ? tmp : '1';
};
