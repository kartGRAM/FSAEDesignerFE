import React from 'react';
import Typography from '@mui/material/Typography';
import {RootState} from '@store/store';
import {useSelector} from 'react-redux';
import {Box} from '@mui/material';
import {alpha} from '@mui/material/styles';
import ROVariablesManager from './readonlyVariables/ROVariablesManager';
import MeasureToolsManager from './measureTools/MeasureToolsManager';
import DatumManager from './datum/DatumManager';

export default function MeasureRoot() {
  const disabled = useSelector((state: RootState) => state.uitgd.uiDisabled);
  return (
    <Box component="div" sx={{position: 'relative'}}>
      <Typography variant="h6">Measure</Typography>
      <DatumManager />
      <MeasureToolsManager />
      <ROVariablesManager />

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
