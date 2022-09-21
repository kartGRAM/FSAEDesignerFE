import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/store';
import IconButton from '@mui/material/IconButton';
import {setViewDirection} from '@store/reducers/uiTempGeometryDesigner';

export default function Fit() {
  const dispatch = useDispatch();
  const get = useSelector((state: RootState) => state.uitgd.gdSceneState.get);
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
          if (get) {
            const {camera} = get();
            dispatch(setViewDirection(camera.quaternion.clone()));
          }
        }}
      >
        <ViewInArIcon sx={{color: '#cccccc'}} />
      </IconButton>
    </Tooltip>
  );
}
