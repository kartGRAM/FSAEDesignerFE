import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
import {useSelector, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {resetPositions} from '@app/store/reducers/uiTempGeometryDesigner';

export default function CResetPositions() {
  const dispatch = useDispatch();
  const disabled = useSelector((state: RootState) => {
    return !state.uitgd.gdSceneState.assembled;
  });

  const handleOnClick = () => {
    const solver = store.getState().uitgd.kinematicSolver;
    // eslint-disable-next-line no-empty
    if (solver && !solver.running) {
      solver.restoreInitialQ();
      dispatch(resetPositions());
    }
  };

  return (
    <Tooltip
      title="Reset Positions"
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
        onClick={handleOnClick}
        disabled={disabled}
      >
        <SvgIcon sx={{color: disabled ? '#555555' : '#cccccc'}}>
          <svg
            version="1.1"
            x="0px"
            y="0px"
            viewBox="0 0 1000 1000"
            enableBackground="new 0 0 1000 1000"
            xmlSpace="preserve"
          >
            <metadata>
              Svg Vector Icons : http://www.onlinewebfonts.com/icon
            </metadata>
            <g>
              <path d="M632.1,14.4L416.7,171c-6.1,4.4-9.6,11.5-9.6,19s3.6,14.6,9.6,19l215.4,156.4c7.1,5.2,16.5,5.9,24.4,1.9c7.9-4,12.9-12.1,12.9-20.9v-86.8c32.1,19,61,43,85.8,72.2c57.4,68.1,84.8,154.5,77.4,243.4C825,664,783.4,744.6,715.2,802s-154.5,84.8-243.4,77.4s-169.3-49.1-226.7-117.3c-57.6-68.3-85-154.5-77.4-243.4c7.5-87,47.8-166.4,113.8-223.6c22.8-19.8,25.1-54.3,5.6-77.2c-19.8-22.8-54.3-25.1-77.2-5.4c-87.7,75.8-141.3,181.4-151.3,297c-10,117.9,26.5,232.5,102.7,323.1c76.2,90.4,183.1,145.7,301,155.9c117.9,10,232.5-26.5,323.1-102.7c90.4-76.2,145.7-183.1,155.9-301c1.2-12.9,1.5-25.5,1.5-38.2c0-104.2-36.3-204-104.2-284.7c-46.5-55.1-104.4-97.1-169.3-124V33.4c0-8.8-5-16.9-12.9-20.9C648.6,8.6,639.2,9.2,632.1,14.4L632.1,14.4z" />
              <path d="M497.7,469.3" />
              <path d="M379.1,556.9c0,66.8,54.1,120.9,120.9,120.9c66.8,0,120.9-54.1,120.9-120.9c0-66.8-54.1-120.9-120.9-120.9C433.3,435.9,379.1,490.1,379.1,556.9L379.1,556.9L379.1,556.9z" />
            </g>
          </svg>
        </SvgIcon>
      </IconButton>
    </Tooltip>
  );
}
