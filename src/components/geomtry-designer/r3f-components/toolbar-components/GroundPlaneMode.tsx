import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
import {useSelector, useDispatch} from 'react-redux';
import {setGroundPlaneShow} from '@store/reducers/uiGeometryDesigner';
import {RootState} from '@store/store';

export default function GroundPlaneMode() {
  const showGrid = useSelector(
    (state: RootState) => state.uigd.present.gdSceneState.showGroundPlaneGrid
  );
  const dispatch = useDispatch();

  const handleOnClick = () => {
    dispatch(setGroundPlaneShow(!showGrid));
  };

  return (
    <Tooltip
      title={showGrid ? 'Hide ground plane' : 'Show ground plane'}
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
          {showGrid ? (
            // NoGridアイコン
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
                <path d="M699,818.2h62.6L699,755.6V818.2z M614.2,818.2V668.7l-24.3-24.3H440.4v173.8L614.2,818.2L614.2,818.2z M355.6,559.6V410.1l-24.3-24.3H181.8v173.8L355.6,559.6L355.6,559.6z M355.6,818.2V644.5H181.8v173.8H355.6z M181.8,238.3V301h62.6L181.8,238.3z M440.4,497v62.6H503L440.4,497z M64.6,10L990,935.4L935.4,990l-86.9-86.9H181.8c-22.9,0-42.8-8.4-59.6-25.3c-16.8-16.8-25.3-36.7-25.3-59.6V151.4L10,64.5L64.6,10z M699,127.2v173.8h173.8V127.2H699z M355.6,127.2h-62.6L206,42.3h666.8c22.9,0,42.8,8.4,59.6,25.3c16.8,16.8,25.3,36.7,25.3,59.6v666.8L872.8,707v-62.6h-62.6l-86.9-84.9h149.5V385.8H699.1v149.5l-84.9-86.9v-62.6h-62.6l-86.9-84.9h149.5V127.2H440.4v149.5l-84.9-86.9V127.2L355.6,127.2z" />
              </g>
            </svg>
          ) : (
            // Gridアイコン
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
                <g transform="translate(0.000000,80.000000) scale(0.100000,-0.100000)">
                  <path d="M406.2,393.8L100,99.8V-4200v-4299.7l306.2-294l294-306.3H5000h4299.7l294,306.3l306.3,294V-4200V99.8l-306.3,294l-294,306.3H5000H700.2L406.2,393.8z M3040-1260v-980h-980h-980v980v980h980h980V-1260z M5980-1260v-980h-980h-980v980v980h980h980V-1260z M8920-1260v-980h-980h-980v980v980h980h980V-1260z M3040-4200v-980h-980h-980v980v980h980h980V-4200z M5980-4200v-980h-980h-980v980v980h980h980V-4200z M8920-4200v-980h-980h-980v980v980h980h980V-4200z M3040-7140v-980h-980h-980v980v980h980h980V-7140z M5980-7140v-980h-980h-980v980v980h980h980V-7140z M8920-7140v-980h-980h-980v980v980h980h980V-7140z" />
                </g>
              </g>
            </svg>
          )}
        </SvgIcon>
      </IconButton>
    </Tooltip>
  );
}
