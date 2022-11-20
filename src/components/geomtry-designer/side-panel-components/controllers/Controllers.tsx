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
import {KeyBindingsDialog} from './KeyBindingsDialog';

export default function Controllers() {
  const dispatch = useDispatch();
  const [kbdOpen, setKbdOpen] = React.useState(false);

  return (
    <>
      <Typography variant="h6">Controllers</Typography>
      <Box
        component="div"
        display="flex"
        alignItems="center"
        justifyContent="center"
        padding={3}
      >
        <Button
          variant="contained"
          size="large"
          onClick={() => setKbdOpen(true)}
        >
          Open the Key Bindings Setting Dialog
        </Button>
      </Box>

      <Accordion onChange={(e, expanded) => {}}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
        >
          <Typography>List of key bindings</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{padding: 0}} />
      </Accordion>
      <KeyBindingsDialog open={kbdOpen} setOpen={setKbdOpen} />
    </>
  );
}
