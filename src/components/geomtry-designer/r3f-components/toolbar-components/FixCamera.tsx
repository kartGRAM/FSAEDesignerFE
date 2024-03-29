/* eslint-disable no-nested-ternary */
import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
import {useSelector, useDispatch} from 'react-redux';
import {
  setOrbitControlsMode,
  orbitControlsModes
} from '@store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';

export default function FixCamera() {
  const mode = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.orbitControlsMode
  );
  const idx = orbitControlsModes.indexOf(mode);
  const next = (idx + 1) % orbitControlsModes.length;
  const dispatch = useDispatch();

  const handleOnClick = () => {
    dispatch(setOrbitControlsMode(orbitControlsModes[next]));
  };

  const {uitgd} = store.getState();
  const zIndex = uitgd.fullScreenZIndex + uitgd.tooltipZIndex;

  const title = [
    'Enable Camera Controls',
    "Driver's view",
    'Fix Camera Position'
  ];

  return (
    <Tooltip
      title={title[idx]}
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
          {mode === 'Fixed' ? (
            // カメラ固定化アイコン
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
                <g transform="translate(0.000000,511.000000) scale(0.100000,-0.100000)">
                  <path d="M9601.9,4779.7c-35.3-22.1-2099.7-2077.6-4585.8-4563.7c-3287.6-3292-4524-4541.6-4535-4588c-30.9-125.8,101.6-253.9,229.6-223C777-4579.6,9811.7,4433,9869.1,4539c46.4,88.3,37.5,145.7-33.1,218.6C9760.9,4832.7,9694.7,4839.3,9601.9,4779.7z" />
                  <path d="M593.7,2512.2c-223-79.5-426.1-313.5-474.7-547.6c-15.5-77.3-22.1-757.3-17.7-2110.7l6.6-1998.2l59.6-125.8c70.6-152.4,214.2-300.3,359.9-373.1c106-50.8,132.5-53,574.1-59.6l463.7-6.6L4102.1-170.4l2536.9,2536.9l-108.2,68.4c-57.4,37.5-141.3,79.5-185.5,90.5c-48.6,13.2-1103.9,22.1-2870.3,19.9C1114.8,2545.3,668.8,2538.7,593.7,2512.2z" />
                  <path d="M8862.3,2015.4c-443.8-194.3-986.9-434.9-1207.7-532.1l-404-176.6V-79.9v-1384.4l150.1-66.2c1079.7-483.5,2283-1000.2,2320.5-1000.2c28.7,0,79.5,28.7,114.8,64l64,64V-79.9v2322.7l-64,64c-35.3,35.3-88.3,64-117,64C9690.2,2370.9,9306.1,2209.7,8862.3,2015.4z" />
                  <path d="M5020.5-863.7L3177-2707.3l1589.7,4.4l1589.7,6.6l117,66.2c154.6,83.9,300.3,247.3,357.7,399.6c44.2,119.2,44.2,152.4,39.7,1667l-6.6,1543.3L5020.5-863.7z" />
                </g>
              </g>
            </svg>
          ) : mode === 'FullOrbit' ? (
            // カメラコントロール有効化アイコン
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
                <g transform="translate(0.000000,511.000000) scale(0.100000,-0.100000)">
                  <path d="M593.7,2699.6c-223-79.5-426.1-313.5-474.7-547.6c-15.5-77.3-22.1-757.3-17.7-2110.8l6.6-1998.2l59.6-125.9c70.6-152.3,214.2-300.3,359.9-373.1l110.4-53h2859.2h2859.2l117,66.2c154.6,83.9,300.3,247.3,355.5,399.6c46.4,119.2,46.4,156.7,46.4,2150.5c0,1993.7,0,2031.3-46.4,2150.5c-55.2,152.3-200.9,315.7-355.5,399.6l-117,66.2l-2837.1,4.4C1103.7,2730.5,668.8,2726.1,593.7,2699.6z" />
                  <path d="M8862.3,2202.9c-443.8-194.3-986.9-435-1207.7-532.1l-404-176.6V107.5v-1384.4l150.1-66.2c1079.7-483.5,2283-1000.2,2320.5-1000.2c28.7,0,79.5,28.7,114.8,64l64,64V107.5v2322.7l-64,64c-35.3,35.3-88.3,64-117,64C9690.2,2558.3,9306.1,2397.1,8862.3,2202.9z" />
                </g>
              </g>
            </svg>
          ) : (
            // ヘルメットアイコン
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              viewBox="0 0 256 256"
              enableBackground="new 0 0 256 256"
              xmlSpace="preserve"
            >
              <metadata>
                Svg Vector Icons : http://www.onlinewebfonts.com/icon
              </metadata>
              <g>
                <path d="M137.2,30.9c-22.9,2-43.9,8.2-60.5,17.7c-31.2,18-52.5,49-62.8,91.4c-3.4,14.2-3.9,18-3.9,32.1c0,11.1,0.1,13.1,1.1,17.9c0.6,3,1,6,1,6.8c0,0.7,0.1,1.4,0.4,1.5c0.2,0.1,1.1,2.5,2.1,5.5c2,6.2,5.4,13.4,8.4,18.1c2.1,3.3,2.1,3.3,3.8,3.1c0.9-0.1,15.1-1.9,31.4-3.8c88.2-10.4,162.8-19.2,164.1-19.5c1.3-0.2,1.9-0.8,3.8-3.8c9-14,15.7-32.4,18.5-51.3c1.2-8.2,1.8-24.7,1-32.2c-3.1-29.7-17.7-53.8-41.7-68.7c-11.5-7-26.8-12.2-42.2-14.2C157.6,31,140.8,30.6,137.2,30.9z M162.2,41.1c10.7,1.5,19.9,4.2,29,8.5c25.6,12.2,41.2,34.3,45,63.7c1,8.1,0.7,23.2-0.7,32.5c-1.3,8.4-4,19-6.7,26.2c-2,5.2-8.1,17.9-9.7,20.1c-0.6,0.8-3.8,1.3-27.2,4c-14.6,1.7-56.6,6.7-93.4,11c-36.8,4.4-67.3,7.9-67.9,7.9c-0.9,0-1.4-0.7-3.2-4.5c-2.4-4.9-4.5-10.4-4.5-11.4c0-0.6,1-0.7,6.2-0.7c3.3,0,9.3-0.2,13.1-0.5c41.8-2.8,72.7-13.3,90.9-30.8c8-7.6,18-23.9,21.6-34.9c2.1-6.6,2.8-11.2,2.5-16.7c-0.6-12.1-7.3-20.8-19.1-25l-3.7-1.3l-44-0.2l-43.9-0.2l3.2-4.3c10.9-14.1,24.9-25,41.9-32.8c10.8-5,28.3-9.6,40.9-10.8c2.8-0.3,5.9-0.6,7-0.7C143,39.8,157,40.4,162.2,41.1z M132.1,98.8c1.4,0.2,4,1.2,5.8,2.1c11.5,5.7,13,19.4,3.9,37.4c-8.2,16.4-18.8,27.3-33.6,34.7c-19.4,9.7-48.4,15.6-78.9,15.8l-9.2,0.1l-0.6-4.4c-0.9-6.8-0.5-22.8,0.8-30.1c3.1-17.6,8.9-35.2,16.3-49.7l3.3-6.3h44.8C112.7,98.3,130.6,98.5,132.1,98.8z" />
                <path d="M112.2,114.8c-2.9,1.1-7,5.3-8,8.2c-1.9,5.4-0.6,10.7,3.3,14.7c3,3,5.7,4.1,9.8,4.1c5.1,0,9.7-2.7,12.4-7.3c1.1-1.9,1.3-2.6,1.3-6.6c0-3.6-0.2-4.7-1-6.3c-1.2-2.2-4.4-5.4-6.6-6.5C121,114,114.9,113.8,112.2,114.8z M120.5,124.7c3,3,0.9,7.9-3.3,7.9c-1.6,0-2.2-0.3-3.3-1.4c-2.9-3.1-0.9-7.8,3.3-7.8C118.8,123.3,119.5,123.6,120.5,124.7z" />
              </g>
            </svg>
          )}
        </SvgIcon>
      </IconButton>
    </Tooltip>
  );
}
