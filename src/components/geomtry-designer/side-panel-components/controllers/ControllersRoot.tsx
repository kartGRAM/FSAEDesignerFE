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
import {
  toggleFixSpringDumperDuaringControl,
  togglePinCenterOfGravityOfFrame
} from '@store/reducers/dataGeometryDesigner';
import {alpha} from '@mui/material/styles';
import {KeyBindingsDialog} from './KeyBindingsDialog';

export default function ControllersRoot() {
  const dispatch = useDispatch();
  const disabled = useSelector((state: RootState) => state.uitgd.uiDisabled);
  const [kbdOpen, setKbdOpen] = React.useState(false);

  const assemblyMode = useSelector(
    (state: RootState) => state.dgd.present.options.assemblyMode
  );
  const fixSpringDumperDuaringControl = useSelector(
    (state: RootState) =>
      state.dgd.present.options.fixSpringDumperDuaringControl
  );
  const pinCenterOfFrame = useSelector(
    (state: RootState) => state.dgd.present.options.pinCenterOfGravityOfFrame
  );
  const handleFSDDCChange = () => {
    dispatch(toggleFixSpringDumperDuaringControl());
  };

  return (
    <Box component="div" sx={{position: 'relative'}}>
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

      <Accordion onChange={() => {}}>
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
          label="Keep spring dumper fixed state duaring operation."
        />
        {assemblyMode === 'AllTiresGrounded' ? (
          <FormControlLabel
            control={
              <Checkbox
                checked={pinCenterOfFrame}
                onChange={() => {
                  dispatch(togglePinCenterOfGravityOfFrame());
                }}
              />
            }
            label="Pin center of gravity of frame object."
          />
        ) : null}
      </Box>

      <KeyBindingsDialog open={kbdOpen} setOpen={setKbdOpen} />
      <Box
        component="div"
        sx={{
          backgroundColor: alpha('#000', 0.3),
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: disabled ? 'unset' : 'none'
        }}
      />
    </Box>
  );
}
