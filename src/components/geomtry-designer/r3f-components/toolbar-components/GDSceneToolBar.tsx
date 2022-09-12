import * as React from 'react';
import Toolbar from '@mui/material/Toolbar';
import {alpha} from '@mui/material/styles';
import Fit from './Fit';
import ProjectionMode from './ProjectionMode';
import ViewDirections from './view-directions/ViewDirections';

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
      <ProjectionMode />
      <Fit />
      <ViewDirections />
    </Toolbar>
  );
}
