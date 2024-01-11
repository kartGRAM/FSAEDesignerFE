import * as React from 'react';
import Toolbar from '@mui/material/Toolbar';
import {alpha} from '@mui/material/styles';
import Fit from './Fit';
import ProjectionMode from './ProjectionMode';
import Assemble from './Assemble';
import Move from './Move';
import ResetPosition from './ResetPosition';
import ViewDirections from './view-directions/ViewDirections';
import GroundPlaneMode from './GroundPlaneMode';
import ComponentVisualizationMode from './ComponentVisualizationMode';
import AssemblyMode from './AssemblyMode';
import FixCamera from './FixCamera';

export default function GDSceneToolBar() {
  return (
    <Toolbar
      sx={{
        minHeight: '24px!important',
        justifyContent: 'center',
        zIndex: 1,
        background: alpha('#FFFFFF', 0)
      }}
    >
      <ResetPosition />
      <Move />
      <Assemble />
      <AssemblyMode />
      <FixCamera />
      <ProjectionMode />
      <Fit />
      <ViewDirections />
      <ComponentVisualizationMode />
      <GroundPlaneMode />
    </Toolbar>
  );
}
