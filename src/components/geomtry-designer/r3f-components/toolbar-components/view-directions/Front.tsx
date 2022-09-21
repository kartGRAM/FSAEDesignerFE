import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
import {setViewDirection} from '@store/reducers/uiTempGeometryDesigner';
import {Quaternion} from 'three';
import {useDispatch} from 'react-redux';

export default function Front(props: {onClick?: () => void}) {
  const {onClick} = props;

  const dispatch = useDispatch();
  return (
    <Tooltip
      title="Front View"
      componentsProps={{
        popper: {
          sx: {
            zIndex: 12500000000,
            '&:hover': {
              display: 'none'
            }
          }
        }
      }}
    >
      <IconButton
        sx={{padding: 0.5}}
        onClick={() => {
          dispatch(setViewDirection(new Quaternion(0, 0, 0, 1)));
          if (onClick) onClick();
        }}
      >
        <SvgIcon sx={{color: '#cccccc'}}>
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
              <g transform="translate(-511.000000,511.000000) scale(0.200000,-0.200000)">
                <path d="M4076.7,2087.9c-146.4-142.4-502.3-488.1-791.1-768.7L2763,808.8l4.1-1462.2l6.1-1462.2l1443.9-6.1l1443.8-4.1l787,789l789,787l-4.1,1443.9l-6.1,1443.9l-1441.8,6.1l-1441.8,4.1L4076.7,2087.9z M6972.6,2189.6c0-8.1-309.1-323.3-687.4-701.6l-687.4-685.3h-571.5c-481.9,0-573.5,4.1-595.8,30.5c-14.2,16.3-40.7,30.5-61,30.5s-46.8-14.2-61-30.5c-22.4-26.4-120-30.5-663-30.5c-349.8,0-640.6,6.1-644.6,16.3c-4.1,8.1,292.8,307.1,658.9,665c473.8,463.7,683.3,652.8,719.9,656.9c28.5,4.1,59,20.3,65.1,36.6c8.1,24.4,197.2,28.5,1269,28.5C6405.2,2205.9,6972.6,2199.8,6972.6,2189.6z M7094.6,825.1V-435.8l-44.7-6.1c-36.6-4-48.8-20.3-52.9-77.3c-6.1-63-75.3-140.3-640.6-705.7c-349.8-349.8-640.6-636.5-648.7-636.5c-10.2,0-16.3,577.6-16.3,1285.3V709.1l685.3,687.4c378.2,378.2,693.5,687.4,701.6,687.4C7088.5,2083.9,7094.6,1516.5,7094.6,825.1z M5549.1-661.5v-1321.9H4251.6c-982.3,0-1303.6,6.1-1321.9,24.4c-18.3,18.3-24.4,339.6-24.4,1321.9V660.3h1321.9h1321.8V-661.5z" />
                <path d="M4322.8,1990.3c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,61-56.9c69.1,0,99.6,46.8,67.1,99.6C4414.3,1994.4,4347.2,2012.7,4322.8,1990.3z" />
                <path d="M4322.8,1705.6c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,61-56.9c69.1,0,99.6,46.8,67.1,99.6C4414.3,1709.7,4347.2,1728,4322.8,1705.6z" />
                <path d="M4322.8,1420.9c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,61-56.9c69.1,0,99.6,46.8,67.1,99.6C4414.3,1425,4347.2,1443.3,4322.8,1420.9z" />
                <path d="M4322.8,1136.2c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,61-56.9c69.1,0,99.6,46.8,67.1,99.6C4414.3,1140.3,4347.2,1158.6,4322.8,1136.2z" />
                <path d="M5868.3-450c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,63.1-56.9c56.9,0,61,4.1,54.9,67.1c-4.1,46.8-16.3,67.1-46.8,71.2C5900.9-437.8,5876.5-441.9,5868.3-450z" />
                <path d="M6153.1-450c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,63-56.9c57,0,61,4.1,54.9,67.1c-4.1,46.8-16.3,67.1-46.8,71.2C6185.6-437.8,6161.2-441.9,6153.1-450z" />
                <path d="M6437.8-450c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,63-56.9c57,0,61,4.1,54.9,67.1c-4.1,46.8-16.3,67.1-46.8,71.2C6470.3-437.8,6445.9-441.9,6437.8-450z" />
                <path d="M6722.5-450c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,63-56.9c57,0,61,4.1,54.9,67.1c-4.1,46.8-16.3,67.1-46.8,71.2C6755-437.8,6730.6-441.9,6722.5-450z" />
                <path d="M3674.1,564.8l-667-6.1L3003-637.1c-6.1-1039.2-2-1197.8,24.4-1224.2c26.4-26.4,185.1-30.5,1226.3-24.4l1193.7,4.1v1220.2V558.7h-496.2c-272.5,0-520.6,2-553.1,6.1C4365.5,568.8,4040.1,568.8,3674.1,564.8z" />
              </g>
            </g>
          </svg>
        </SvgIcon>
      </IconButton>
    </Tooltip>
  );
}
