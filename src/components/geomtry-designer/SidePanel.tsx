import React from 'react';
import Box from '@mui/material/Box';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {useSelector} from 'react-redux';
import {NumberToRGB} from '@app/utils/helpers';
import {RootState} from '@store/store';
import Divider from '@mui/material/Divider';

export default function SidePanel() {
  const bgColor: number = useSelector(
    (state: RootState) => state.uigd.sidePanelState.backgroundColor
  );
  const fontColor: number = useSelector(
    (state: RootState) => state.uigd.sidePanelState.fontColor
  );
  const panelWidth: string = useSelector(
    (state: RootState) => state.uigd.sidePanelState.panelWidth
  );

  return (
    <>
      <Box
        sx={{
          backgroundColor: NumberToRGB(bgColor),
          height: '100%',
          width: panelWidth,

          color: NumberToRGB(fontColor)
        }}
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

      <Divider orientation="vertical" flexItem />
    </>
  );
}
