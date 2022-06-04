import React from 'react';
import Box from '@mui/material/Box';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {useSelector, useDispatch} from 'react-redux';
import {NumberToRGB} from '@app/utils/helpers';
import {RootState} from '@store/store';
import Divider from '@mui/material/Divider';
import {alpha} from '@mui/material/styles';
// eslint-disable-next-line no-unused-vars
import {resizePanel} from '@app/store/reducers/uiGeometryDesigner';
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

  const dispatch = useDispatch();

  // eslint-disable-next-line no-unused-vars
  const clipWidth = (wpx: number): number => {
    wpx = Math.max(0, Math.min(wpx, 1000));
    if (wpx < minWidth) wpx = 0;
    return wpx;
  };

  React.useEffect(() => {
    const resize = (e: any, ui: any) => {
      if (ui.position.left < minWidth) {
        ui.position.left = 0;
      }
      if (ui.position.left > 1000) {
        ui.position.left = 1000;
      }
      if (boxRef.current) {
        boxRef.current.style.width = `${ui.position.left}px`;
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
      dispatch(resizePanel(ui.position.left));
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
    <>
      <Box
        sx={{
          backgroundColor: NumberToRGB(bgColor),
          height: '100%',
          width: `${panelWidth}px`,
          paddingLeft: 1,
          paddingRight: 1,
          flexShrink: 0,
          display: collapsed ? 'none' : 'unset',
          color: NumberToRGB(fontColor)
        }}
        ref={boxRef}
      >
        <Typography variant="h6">Variables</Typography>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>Accordion 1</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Suspendisse malesuada lacus ex, sit amet blandit leo lobortis
              eget.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2a-content"
            id="panel2a-header"
          >
            <Typography>Accordion 2</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Suspendisse malesuada lacus ex, sit amet blandit leo lobortis
              eget.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion disabled>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel3a-content"
            id="panel3a-header"
          >
            <Typography>Disabled Accordion</Typography>
          </AccordionSummary>
        </Accordion>
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
