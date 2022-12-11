/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {toggleFixSpringDumperDuaringControl} from '@store/reducers/uiGeometryDesigner';
import {KeyBindingsDialog} from './KeyBindingsDialog';

export default function Controllers() {
  const dispatch = useDispatch();
  const [kbdOpen, setKbdOpen] = React.useState(false);
  const fixSpringDumperDuaringControl = useSelector(
    (state: RootState) =>
      state.uigd.present.gdSceneState.fixSpringDumperDuaringControl
  );
  const handleFSDDCChange = () => {
    dispatch(toggleFixSpringDumperDuaringControl());
  };

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
          Open the Key Bindings Dialog
        </Button>
      </Box>

      <Accordion
        TransitionProps={{unmountOnExit: true}}
        onChange={(e, expanded) => {}}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
        >
          <Typography>List of key bindings</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{padding: 0}} />
      </Accordion>
      <Box component="div" padding={3}>
        <FormControlLabel
          control={
            <Checkbox
              checked={fixSpringDumperDuaringControl}
              onChange={handleFSDDCChange}
            />
          }
          label="Fix spring dumper duaring control"
        />
      </Box>

      <KeyBindingsDialog open={kbdOpen} setOpen={setKbdOpen} />
    </>
  );
}
