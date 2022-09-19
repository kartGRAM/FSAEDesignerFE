import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import {useDispatch} from 'react-redux';
import IconButton from '@mui/material/IconButton';
import {fitToScreen} from '@store/reducers/uiTempGeometryDesigner';

export default function Fit() {
  const dispatch = useDispatch();
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
      <IconButton
        sx={{padding: 0.5}}
        onClick={() => {
          dispatch(fitToScreen());
        }}
      >
        <ViewInArIcon sx={{color: '#cccccc'}} />
      </IconButton>
    </Tooltip>
  );
}
