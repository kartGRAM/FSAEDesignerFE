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

export default function SidePanel() {
  const [initialPos, setInitialPos] = React.useState<number>(0);

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
  const [initialWidth, setInitialWidth] = React.useState<number | null>(0);
  const enabledColorLight: number = useSelector(
    (state: RootState) => state.uigd.enabledColorLight
  );

  // eslint-disable-next-line no-unused-vars
  const dispatch = useDispatch();

  const initial = (e: React.DragEvent) => {
    e.dataTransfer.setDragImage(new Image(), 0, 0);
    // e.dataTransfer.effectAllowed = 'move';
    // e.dataTransfer.dropEffect = 'move';
    setInitialPos(e.clientX);
    const initial = boxRef.current?.offsetWidth;
    if (initial !== undefined) {
      setInitialWidth(initial);
    }
    // const html = document.getElementsByTagName('html');
    // html[0].style.cursor = 'col-resize';
  };

  const clipWidth = (wpx: number): number => {
    wpx = Math.max(0, Math.min(wpx, 1000));
    if (wpx < minWidth) wpx = 0;
    return wpx;
  };

  const resize = (e: React.MouseEvent) => {
    if (initialWidth !== null) {
      const wpx = clipWidth(initialWidth + e.clientX - initialPos);
      const width = `${wpx}px`;
      if (boxRef.current) {
        boxRef.current.style.width = width;
        boxRef.current.style.display = 'unset';
        if (wpx === 0) boxRef.current.style.display = 'none';
      }
      if (dividerRef.current) {
        dividerRef.current.style.left = `calc(${width} - 2px)`;
      }
      // dispatch(resizePanel(width));
    }
  };

  const resizeEnd = (e: React.MouseEvent) => {
    if (initialWidth !== null) {
      if (boxRef.current) {
        boxRef.current.removeAttribute('style');
      }
      if (dividerRef.current) {
        dividerRef.current.removeAttribute('style');
      }
      const width = clipWidth(initialWidth + e.clientX - initialPos);
      dispatch(resizePanel(width));
    }
  };
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
        onDragStart={initial}
        onDrag={resize}
        onDragEnd={resizeEnd}
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
            backgroundColor: NumberToRGB(enabledColorLight),
            cursor: 'col-resize'
          }
        }}
      />
    </>
  );
}
