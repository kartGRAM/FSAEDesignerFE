import React from 'react';
import Typography from '@mui/material/Typography';
import DatumManager from './DatumManager';
import MeasureToolsManager from './MeasureToolsManager';

export default function MeasureRoot() {
  return (
    <>
      <Typography variant="h6">Measure</Typography>
      <DatumManager />
      <MeasureToolsManager />
    </>
  );
}
