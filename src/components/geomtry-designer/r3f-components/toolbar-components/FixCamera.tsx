import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
import {useSelector, useDispatch} from 'react-redux';
import {setOrbitControlsEnabledManual} from '@store/reducers/uiTempGeometryDesigner';
import {RootState} from '@store/store';

export default function FixCamera() {
  const enabled = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.orbitControlsEnabledManual
  );
  const dispatch = useDispatch();

  const handleOnClick = () => {
    dispatch(setOrbitControlsEnabledManual(!enabled));
  };

  return (
    <Tooltip
      title={enabled ? 'Fix Camera Position' : 'Camera Controls Enabled'}
      componentsProps={{
        popper: {
          sx: {
            zIndex: 12500000000
          }
        }
      }}
    >
      <IconButton sx={{padding: 0.5}} onClick={handleOnClick}>
        <SvgIcon sx={{color: '#cccccc'}}>
          {enabled ? (
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
          ) : (
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
          )}
        </SvgIcon>
      </IconButton>
    </Tooltip>
  );
}
