/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {
  datumObjectAccordionDefaultExpandedChange,
  measureToolsAccordionDefaultExpandedChange
} from '@store/reducers/uiGeometryDesigner';

export default function MeasureRoot() {
  const dispatch = useDispatch();
  const datumObjectsAccExpanded = useSelector(
    (state: RootState) =>
      state.uigd.present.measurePanelState.DatumObjectsExpanded
  );
  const measureToolsAccExpanded = useSelector(
    (state: RootState) =>
      state.uigd.present.measurePanelState.MeasureToolsExpanded
  );

  return (
    <>
      <Typography variant="h6">Controllers</Typography>
      <Accordion
        TransitionProps={{unmountOnExit: true}}
        expanded={datumObjectsAccExpanded}
        onChange={(e, expanded) => {
          dispatch(datumObjectAccordionDefaultExpandedChange(expanded));
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
        >
          <Typography>Datum Objects</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{padding: 0}}>
          <Box component="div" />
        </AccordionDetails>
      </Accordion>
      <Accordion
        TransitionProps={{unmountOnExit: true}}
        expanded={measureToolsAccExpanded}
        onChange={(e, expanded) => {
          dispatch(measureToolsAccordionDefaultExpandedChange(expanded));
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2a-content"
        >
          <Typography>Measure Tools</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{padding: 0}} />
      </Accordion>
    </>
  );
}
