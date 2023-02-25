import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
import {useSelector, useDispatch} from 'react-redux';
import {setAssembled} from '@store/reducers/uiTempGeometryDesigner';

import {RootState} from '@store/store';

export default function Assemble() {
  const assembled = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.assembled
  );
  const dispatch = useDispatch();

  const handleOnClick = () => {
    dispatch(setAssembled(!assembled));
  };

  const zIndex = useSelector(
    (state: RootState) =>
      state.uitgd.fullScreenZIndex + state.uitgd.tooltipZIndex
  );

  return (
    <Tooltip
      title={
        assembled ? 'Disassemble & Reset Positions.' : 'Assemble Components.'
      }
      componentsProps={{
        popper: {
          sx: {
            zIndex
          }
        }
      }}
    >
      <IconButton sx={{padding: 0.5}} onClick={handleOnClick}>
        <SvgIcon sx={{color: '#cccccc'}}>
          {assembled ? (
            // Disassembleアイコン
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
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
                <path d="M944.1,285.6c-25.3,0-45.9-20.6-45.9-45.9v-72.8L746.9,318.1c-8.3,8.3-19.8,13.5-32.5,13.5c-25.4,0-45.9-20.6-45.9-45.9c0-12.7,5.1-24.2,13.5-32.5l151.3-151.3h-72.9c-25.4,0-45.9-20.6-45.9-45.9c0-25.4,20.6-45.9,45.9-45.9h183.7c25.4,0,45.9,20.6,45.9,45.9v183.8C990,265.1,969.5,285.6,944.1,285.6 M500,637.8c-76.1,0-137.8-61.7-137.8-137.8c0-76.1,61.7-137.8,137.8-137.8c76.1,0,137.8,61.7,137.8,137.8C637.8,576.1,576.1,637.8,500,637.8 M166.8,898.1h72.8c25.4,0,45.9,20.6,45.9,45.9c0,25.4-20.6,45.9-45.9,45.9H55.9C30.6,990,10,969.4,10,944.1V760.3c0-25.4,20.6-45.9,45.9-45.9c25.4,0,45.9,20.6,45.9,45.9v72.8l151.3-151.3c8.3-8.3,19.8-13.5,32.5-13.5c25.4,0,45.9,20.6,45.9,45.9c0,12.7-5.1,24.2-13.4,32.5L166.8,898.1z" />
              </g>
            </svg>
          ) : (
            // アセンブルアイコン
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
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
                <path d="M976.5,88.4L825.3,239.7h72.8c25.4,0,45.9,20.6,45.9,45.9c0,25.4-20.6,45.9-45.9,45.9H714.4c-25.4,0-45.9-20.6-45.9-45.9V101.9c0-25.4,20.6-45.9,45.9-45.9c25.4,0,45.9,20.6,45.9,45.9v72.8L911.6,23.5c8.3-8.3,19.8-13.5,32.5-13.5c25.4,0,45.9,20.6,45.9,45.9C990,68.6,984.9,80.1,976.5,88.4 M500,637.8c-76.1,0-137.8-61.7-137.8-137.8c0-76.1,61.7-137.8,137.8-137.8c76.1,0,137.8,61.7,137.8,137.8C637.8,576.1,576.1,637.8,500,637.8 M285.6,944.1c-25.4,0-45.9-20.6-45.9-45.9v-72.8L88.4,976.5c-8.3,8.3-19.8,13.5-32.5,13.5C30.6,990,10,969.4,10,944.1c0-12.7,5.1-24.2,13.5-32.5l151.3-151.3h-72.8c-25.4,0-45.9-20.6-45.9-45.9c0-25.4,20.6-45.9,45.9-45.9h183.8c25.4,0,45.9,20.6,45.9,45.9v183.7C331.6,923.5,311,944.1,285.6,944.1" />
              </g>
            </svg>
          )}
        </SvgIcon>
      </IconButton>
    </Tooltip>
  );
}
