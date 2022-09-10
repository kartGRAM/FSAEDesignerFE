import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import IconButton from '@mui/material/IconButton';

export default function Fit() {
  return (
    <Tooltip
      title="Fit within the screen"
      componentsProps={{
        popper: {
          sx: {
            zIndex: 12500000000
          }
        }
      }}
    >
      <IconButton sx={{padding: 0.5}}>
        <ViewInArIcon sx={{color: '#cccccc'}} />
      </IconButton>
    </Tooltip>
  );
}
