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

export default function DatumObjects() {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = React.useState<string>('');
  const datumGroups =
    useSelector((state: RootState) => state.uitgd.datumManager)?.children ?? [];

  return datumGroups.map((group) => (
    <Accordion
      key={group.nodeID}
      TransitionProps={{unmountOnExit: true}}
      expanded={group.nodeID === expanded}
      onChange={() => {
        setExpanded(group.name);
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1a-content"
      >
        <Typography>{group.name}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{padding: 0}}>
        <Box component="div" />
      </AccordionDetails>
    </Accordion>
  ));
}
