import React from 'react';
import Typography from '@mui/material/Typography';
import DatumManager from './datum/DatumManager';
import MeasureToolsManager from './measureTools/MeasureToolsManager';
import ROVariablesManager from './readonlyVariables/ROVariablesManager';

export default function MeasureRoot() {
  return (
    <>
      <Typography variant="h6">Measure</Typography>
      <DatumManager />
      <MeasureToolsManager />
      <ROVariablesManager />
    </>
  );
}
