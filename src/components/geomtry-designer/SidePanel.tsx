import React from 'react';
import Box from '@mui/material/Box';
import {useSelector, useDispatch} from 'react-redux';
import {numberToRgb} from '@app/utils/helpers';
import store, {RootState} from '@store/store';
import Divider from '@mui/material/Divider';
import {alpha} from '@mui/material/styles';
import {resizePanel} from '@store/reducers/uiGeometryDesigner';
import ParametersRoot from '@gdComponents/side-panel-components/parameters/ParametersRoot';
import ElementsRoot from '@gdComponents/side-panel-components/elements/ElementsRoot';
import MeasureRoot from '@gdComponents/side-panel-components/measure/MeasureRoot';
import Controllers from '@gdComponents/side-panel-components/controllers/ControllersRoot';
import Analysis from '@gdComponents/side-panel-components/analysis/AnalysisRoot';
import $ from 'jquery';
import 'jqueryui';

export default function SidePanel() {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const dividerRef = React.useRef<HTMLHRElement>(null);
  const bgColor: number = useSelector(
    (state: RootState) => state.uigd.sidePanelState.backgroundColor
  );
  const fontColor: number = useSelector(
    (state: RootState) => state.uigd.sidePanelState.fontColor
  );
  const panelWidth: number = useSelector(
    (state: RootState) => state.uigd.sidePanelState.panelWidth
  );
  const minWidth: Number = useSelector(
    (state: RootState) => state.uigd.sidePanelState.minWidth
  );
  const collapsed: boolean = useSelector(
    (state: RootState) => state.uigd.sidePanelState.collapsed
  );
  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.enabledColorLight
  );
  const selectedTab = useSelector(
    (state: RootState) => state.uitgd.sidePanelState.selectedTab
  );

  const dispatch = useDispatch();

  const {uitgd} = store.getState();
  const zIndex = uitgd.fullScreenZIndex + uitgd.menuZIndex;

  // ドラッグ中にカーソルがdisabledになるのを防止するため(だけに)、jQueryUIを使用する。
  React.useEffect(() => {
    const resize = (e: any, ui: any) => {
      if (ui.position.left < minWidth) {
        ui.position.left = 0;
      }
      if (ui.position.left > 1000) {
        ui.position.left = 1000;
      }
      if (boxRef.current) {
        boxRef.current.style.width = `${ui.position.left + 2}px`;
        boxRef.current.style.display = 'unset';
        if (ui.position.left === 0) boxRef.current.style.display = 'none';
      }
    };
    const resizeEnd = (e: any, ui: any) => {
      if (boxRef.current) {
        boxRef.current.removeAttribute('style');
      }
      if (dividerRef.current) {
        dividerRef.current.removeAttribute('style');
      }
      dispatch(resizePanel(ui.position.left + 2));
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
  }, [dispatch, minWidth]);

  let adContent: JSX.Element | null = null;

  if (selectedTab === 'elements') {
    adContent = <ElementsRoot />;
  } else if (selectedTab === 'parameters') {
    adContent = <ParametersRoot />;
  } else if (selectedTab === 'controllers') {
    adContent = <Controllers />;
  } else if (selectedTab === 'measure') {
    adContent = <MeasureRoot />;
  } else if (selectedTab === 'analysis') {
    adContent = <Analysis />;
  }

  return (
    <>
      <Box
        component="div"
        sx={{
          backgroundColor: numberToRgb(bgColor),
          height: '100%',
          width: `${panelWidth}px`,
          paddingLeft: 1,
          paddingRight: 1,
          flexShrink: 0,
          position: 'relative',
          display: collapsed ? 'none' : 'unset',
          color: numberToRgb(fontColor),
          // 単にオーバーフローとした場合、横スクロールバーのスペース分空白ができてしまう
          overflowY: 'scroll',
          '&::-webkit-scrollbar': {
            width: '10px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(numberToRgb(enabledColorLight), 0.3),
            borderRadius: '5px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: numberToRgb(bgColor)
          }
        }}
        ref={boxRef}
        id="gdSidePanel"
      >
        {adContent}
      </Box>

      <Divider
        orientation="vertical"
        flexItem
        draggable="true"
        ref={dividerRef}
        sx={{
          position: 'absolute',
          height: '100%',
          left: `calc(${panelWidth}px - 2px)`,
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
    </>
  );
}
