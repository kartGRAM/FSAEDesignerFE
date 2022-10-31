import * as React from 'react';
import Toolbar from '@mui/material/Toolbar';
import {alpha} from '@mui/material/styles';
import Fit from './Fit';
import ProjectionMode from './ProjectionMode';
import Assemble from './Assemble';
import Move from './Move';
import ViewDirections from './view-directions/ViewDirections';
import ComponentVisualizationMode from './ComponentVisualizationMode';

export default function GDSceneToolBar() {
  return (
    <Toolbar
      sx={{
        minHeight: '24px!important',
        justifyContent: 'center',
        zIndex: 1,
        background: alpha('#FFFFFF', 0.0)
      }}
    >
      <Move />
      <Assemble />
      <ProjectionMode />
      <Fit />
      <ViewDirections />
      <ComponentVisualizationMode />
    </Toolbar>
  );
}
