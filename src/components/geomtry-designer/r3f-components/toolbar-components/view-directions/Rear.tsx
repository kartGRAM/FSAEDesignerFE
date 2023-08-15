import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
import {setViewDirection} from '@store/reducers/uiTempGeometryDesigner';
import {Quaternion} from 'three';
import {useDispatch} from 'react-redux';
import store from '@store/store';

export default function Rear(props: {onClick?: () => void}) {
  const {onClick} = props;

  const dispatch = useDispatch();
  const {uitgd} = store.getState();
  const zIndex = uitgd.fullScreenZIndex + uitgd.tooltipZIndex;
  return (
    <Tooltip
      title="Rear View"
      componentsProps={{
        popper: {
          sx: {
            zIndex,
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
          dispatch(setViewDirection(new Quaternion(0, 1, 0, 0)));
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
              {' '}
              Svg Vector Icons : http://www.onlinewebfonts.com/icon{' '}
            </metadata>
            <g>
              <g transform="translate(-511.000000,511.000000) scale(0.200000,-0.200000)">
                <path d="M3552.1,1559.2l-789-787l4.1-1443.9l6.1-1443.9l1443.9-6.1l1443.8-4.1l787,789l789,787l-4.1,1443.9l-6.1,1443.9l-1443.9,6.1l-1443.8,4.1L3552.1,1559.2z M6972.6,2191.7c0-8.1-24.4-40.7-54.9-71.2l-54.9-56.9H5728H4593.3v-630.4V802.7h-69.2c-36.6,0-79.3,14.2-93.5,30.5c-14.2,16.3-40.7,30.5-61,30.5s-46.8-14.2-61-30.5c-22.4-26.4-120-30.5-652.8-30.5c-345.7,0-628.4,6.1-628.4,14.2c0,10.2,294.9,311.1,654.8,671.1c479.9,479.9,669.1,656.9,703.6,656.9c24.4,0,50.8,14.2,56.9,30.5c10.2,26.4,170.8,30.5,1271,30.5C6405.2,2205.9,6972.6,2199.8,6972.6,2191.7z M7094.6,825.1V-435.8l-44.7-6.1c-36.6-4-48.8-20.3-52.9-77.3c-6.1-63-75.3-140.3-640.6-705.7c-349.8-349.8-640.6-636.5-648.7-636.5c-10.2,0-16.3,351.8-16.3,782.9v782.9h630.4h630.4V837.3V1970l54.9,56.9c30.5,30.5,61,56.9,71.2,56.9C7086.5,2083.9,7094.6,1516.5,7094.6,825.1z M4593.3,182.4v-477.9h477.9h477.9v-844v-843.9H4251.6c-982.3,0-1303.6,6.1-1321.9,24.4c-18.3,18.3-24.4,339.6-24.4,1321.9V660.3h844h843.9V182.4z" />
                <path d="M4322.8,1990.3c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,61-56.9c69.1,0,99.6,46.8,67.1,99.6C4414.3,1994.4,4347.2,2012.7,4322.8,1990.3z" />
                <path d="M4322.8,1705.6c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,61-56.9c69.1,0,99.6,46.8,67.1,99.6C4414.3,1709.7,4347.2,1728,4322.8,1705.6z" />
                <path d="M4322.8,1420.9c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,61-56.9c69.1,0,99.6,46.8,67.1,99.6C4414.3,1425,4347.2,1443.3,4322.8,1420.9z" />
                <path d="M4322.8,1136.2c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,61-56.9c69.1,0,99.6,46.8,67.1,99.6C4414.3,1140.3,4347.2,1158.6,4322.8,1136.2z" />
                <path d="M5868.3-450c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,63.1-56.9c56.9,0,61,4.1,54.9,67.1c-4.1,46.8-16.3,67.1-46.8,71.2C5900.9-437.8,5876.5-441.9,5868.3-450z" />
                <path d="M6153.1-450c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,63-56.9c57,0,61,4.1,54.9,67.1c-4.1,46.8-16.3,67.1-46.8,71.2C6185.6-437.8,6161.2-441.9,6153.1-450z" />
                <path d="M6437.8-450c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,63-56.9c57,0,61,4.1,54.9,67.1c-4.1,46.8-16.3,67.1-46.8,71.2C6470.3-437.8,6445.9-441.9,6437.8-450z" />
                <path d="M6722.5-450c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,63-56.9c57,0,61,4.1,54.9,67.1c-4.1,46.8-16.3,67.1-46.8,71.2C6755-437.8,6730.6-441.9,6722.5-450z" />
                <path d="M4322.8,566.8c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,61-56.9c69.1,0,99.6,46.8,67.1,99.6C4414.3,570.9,4347.2,589.2,4322.8,566.8z" />
                <path d="M4322.8,282.1c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,61-56.9c69.1,0,99.6,46.8,67.1,99.6C4414.3,286.2,4347.2,304.5,4322.8,282.1z" />
                <path d="M4322.8-2.6c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,61-56.9c69.1,0,99.6,46.8,67.1,99.6C4414.3,1.4,4347.2,19.7,4322.8-2.6z" />
                <path d="M4322.8-287.3c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,61-56.9c69.1,0,99.6,46.8,67.1,99.6C4414.3-283.3,4347.2-265,4322.8-287.3z" />
                <path d="M4444.8-450c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,63-56.9c56.9,0,61,4.1,54.9,67.1c-4.1,46.8-16.3,67.1-46.8,71.2C4477.4-437.8,4453-441.9,4444.8-450z" />
                <path d="M4729.6-450c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,63-56.9c56.9,0,61,4.1,54.9,67.1c-4.1,46.8-16.3,67.1-46.8,71.2C4762.1-437.8,4737.7-441.9,4729.6-450z" />
                <path d="M5014.3-450c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,63-56.9c56.9,0,61,4.1,54.9,67.1c-4.1,46.8-16.3,67.1-46.8,71.2C5046.8-437.8,5022.4-441.9,5014.3-450z" />
                <path d="M5298.9-450c-8.1-8.1-14.2-40.7-14.2-73.2c0-50.8,8.1-56.9,63.1-56.9c56.9,0,61,4.1,54.9,67.1c-4.1,46.8-16.3,67.1-46.8,71.2C5331.5-437.8,5307.1-441.9,5298.9-450z" />
                <path d="M4237.4-559.8c-71.2-77.3,22.4-160.6,97.6-85.4c40.7,42.7,40.7,44.7,4.1,85.4C4294.3-509,4284.2-509,4237.4-559.8z" />
                <path d="M4034-763.2c-36.6-40.7-36.6-42.7,6.1-87.4l44.7-42.7l44.7,42.7c42.7,44.7,42.7,46.8,6.1,87.4c-20.3,22.4-42.7,40.7-50.8,40.7C4076.7-722.5,4054.4-740.8,4034-763.2z" />
                <path d="M3830.7-966.6c-36.6-40.7-36.6-42.7,6.1-87.4l44.7-42.7l42.7,42.7c34.6,34.6,38.6,48.8,20.3,85.4C3914.1-915.7,3877.5-913.7,3830.7-966.6z" />
                <path d="M3627.3-1169.9c-36.6-40.7-36.6-42.7,6.1-87.4l44.7-42.7l44.7,44.7c36.6,36.6,40.7,52.9,24.4,81.3C3714.8-1123.2,3670-1121.1,3627.3-1169.9z" />
                <path d="M3424-1373.3c-36.6-40.7-36.6-42.7,6.1-87.4l44.7-42.7l44.7,44.7c36.6,36.6,40.7,52.9,24.4,81.3C3511.4-1326.5,3466.7-1324.5,3424-1373.3z" />
                <path d="M3222.6-1574.6c-34.6-38.7-34.6-40.7,8.1-83.4l44.7-44.7l42.7,42.7c34.6,34.6,38.6,50.8,22.4,79.3C3308-1531.9,3265.3-1527.8,3222.6-1574.6z" />
                <path d="M3031.5-1765.8l-44.7-46.8l46.8-44.7c46.8-44.7,48.8-44.7,81.3-8.1c44.7,48.8,42.7,71.2-2,111.9C3078.2-1721,3072.1-1723.1,3031.5-1765.8z" />
              </g>
            </g>
          </svg>
        </SvgIcon>
      </IconButton>
    </Tooltip>
  );
}
