import React from 'react';
import Box from '@mui/material/Box';
import {useSelector, useDispatch} from 'react-redux';
import {NumberToRGB} from '@app/utils/helpers';
import {RootState} from '@store/store';
import Divider from '@mui/material/Divider';
import {alpha} from '@mui/material/styles';
// eslint-disable-next-line no-unused-vars
import {resizePanel} from '@app/store/reducers/uiGeometryDesigner';
import ParametersRoot from '@app/components/geomtry-designer/side-panel-components/parameters/ParametersRoot';
import ElementsRoot from '@app/components/geomtry-designer/side-panel-components/elements/ElementsRoot';
import $ from 'jquery';
import 'jqueryui';

export default function SidePanel() {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const dividerRef = React.useRef<HTMLHRElement>(null);
  const bgColor: number = useSelector(
    (state: RootState) => state.uigd.present.sidePanelState.backgroundColor
  );
  const fontColor: number = useSelector(
    (state: RootState) => state.uigd.present.sidePanelState.fontColor
  );
  const panelWidth: number = useSelector(
    (state: RootState) => state.uigd.present.sidePanelState.panelWidth
  );
  const minWidth: Number = useSelector(
    (state: RootState) => state.uigd.present.sidePanelState.minWidth
  );
  const collapsed: boolean = useSelector(
    (state: RootState) => state.uigd.present.sidePanelState.collapsed
  );
  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.present.enabledColorLight
  );
  const selectedTab: string = useSelector(
    (state: RootState) => state.uitgd.sidePanelState.selectedTab
  );

  const disabled = useSelector((state: RootState) => state.uitgd.uiDisabled);
  const dispatch = useDispatch();

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
  }, [dispatch]);

  // eslint-disable-next-line no-undef
  let adContent: JSX.Element | null = null;

  if (selectedTab === 'elements') {
    adContent = <ElementsRoot />;
  } else if (selectedTab === 'parameters') {
    adContent = <ParametersRoot />;
  }

  return (
    <>
      <Box
        sx={{
          backgroundColor: NumberToRGB(bgColor),
          height: '100%',
          width: `${panelWidth}px`,
          paddingLeft: 1,
          paddingRight: 1,
          flexShrink: 0,
          position: 'relative',
          display: collapsed ? 'none' : 'unset',
          color: NumberToRGB(fontColor),
          overflow: 'scroll',
          '&::-webkit-scrollbar': {
            width: '10px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(NumberToRGB(enabledColorLight), 0.3),
            borderRadius: '5px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: NumberToRGB(bgColor)
          }
        }}
        ref={boxRef}
      >
        {adContent}
        <Box
          sx={{
            backgroundColor: alpha('#000', 0.3),
            position: 'absolute',
            right: 0,
            bottom: 0,
            top: 0,
            left: 0,
            display: disabled ? 'unset' : 'none'
          }}
        />
      </Box>

      <Divider
        orientation="vertical"
        flexItem
        draggable="true"
        // onDragStart={initial}
        // onDrag={resize}
        // onDragEnd={resizeEnd}
        ref={dividerRef}
        sx={{
          position: 'absolute',
          height: '100%',
          left: `calc(${panelWidth}px - 2px)`,
          width: '4px',
          zIndex: 1000,
          backgroundColor: 'transparent',
          borderColor: alpha('#000000', 0),
          cursor: 'col-resize',

          transition: 'background-color 0.15s ease 0s',
          '&:hover': {
            backgroundColor: NumberToRGB(enabledColorLight)
          },
          '&:active': {
            cursor: 'col-resize',
            backgroundColor: NumberToRGB(enabledColorLight)
          }
        }}
      />
    </>
  );
}
