import * as React from 'react';
import Toolbar from '@mui/material/Toolbar';
import {alpha} from '@mui/material/styles';
import Fit from './Fit';
import ProjectionMode from './ProjectionMode';
import Front from './view-directions/Front';
import Rear from './view-directions/Rear';
import Left from './view-directions/Left';
import Right from './view-directions/Right';
import Top from './view-directions/Top';
import Bottom from './view-directions/Bottom';
import Isometric from './view-directions/Isometric';

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
      <Front />
      <Rear />
      <Left />
      <Right />
      <Top />
      <Bottom />
      <Isometric />
    </Toolbar>
  );
}
