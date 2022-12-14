import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {measureToolsAccordionDefaultExpandedChange} from '@store/reducers/uiGeometryDesigner';
import DatumObjects from './DatumObjects';

export default function MeasureRoot() {
  const dispatch = useDispatch();
  const measureToolsAccExpanded = useSelector(
    (state: RootState) =>
      state.uigd.present.measurePanelState.MeasureToolsExpanded
  );

  return (
    <>
      <Typography variant="h6">Measure</Typography>
      <DatumObjects />

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
