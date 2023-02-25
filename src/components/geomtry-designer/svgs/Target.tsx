import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
// eslint-disable-next-line import/no-extraneous-dependencies
import {SxProps} from '@mui/system';
import {Theme} from '@mui/material/styles';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';

export default function Target(props: {
  onClick?: () => void;
  title: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}) {
  const {onClick, title, disabled, sx} = props;
  const tooltipZIndex = useSelector(
    (state: RootState) =>
      state.uitgd.fullScreenZIndex +
      state.uitgd.dialogZIndex +
      state.uitgd.tooltipZIndex
  );
  return (
    <Tooltip
      title={title}
      componentsProps={{
        popper: {
          sx: {
            zIndex: tooltipZIndex,
            '&:hover': {
              display: 'none'
            }
          }
        }
      }}
    >
      <span>
        <IconButton
          disabled={disabled}
          onClick={() => {
            if (onClick) onClick();
          }}
          sx={sx}
        >
          <SvgIcon sx={{color: '#999'}}>
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
                  <path d="M4516.9,4503.9v-506.1l-50.6-9.2c-556.7-105.8-853.5-200.1-1237.7-395.7c-388.8-200.1-671.7-407.2-989.2-722.3c-315.2-317.5-522.2-600.4-722.3-989.2c-195.5-384.2-289.9-680.9-395.7-1235.4l-9.2-52.9H606.1H100V110v-483.1h506.1h506.1l9.2-50.6c105.8-556.7,200.1-853.5,395.7-1237.7c200.1-388.8,407.2-671.7,722.3-989.2c317.5-315.2,600.4-522.2,989.2-722.4c384.2-195.5,680.9-289.9,1237.7-395.7l50.6-9.2v-506.1V-4790H5000h483.1v506.1v506.1l52.9,9.2c347.4,66.7,480.8,98.9,708.5,174.8c1309,432.5,2330.4,1587.3,2585.7,2921.6c20.7,108.1,41.4,218.5,48.3,246.2l9.2,52.9h506.1H9900V110v483.1h-506.1h-506.1l-9.2,52.9c-6.9,27.6-27.6,138-48.3,246.2c-20.7,108.1-78.2,315.2-126.5,462.4c-381.9,1152.5-1306.7,2077.3-2459.2,2459.2c-227.7,75.9-361.2,108.1-708.5,174.8l-52.9,9.2v506.1V5010H5000h-483.1V4503.9z M4516.9,2504.8V2001l-119.6-39.1c-167.9-55.2-432.5-197.8-595.8-322.1c-273.8-211.7-536-579.7-644.1-901.8L3109,593.1h-506.1h-506.1l16.1,110.4c23,163.3,119.6,450.9,223.1,664.8c287.6,607.3,800.6,1120.3,1403.3,1405.6c262.3,124.2,582,225.5,726.9,232.3l50.6,2.3V2504.8z M5908.7,2914.3c904.1-301.4,1601.1-998.4,1895.6-1897.9c36.8-115,73.6-255.4,82.8-315.2l16.1-108.1h-506.1H6891L6851.9,715c-181.7,552.1-637.2,1021.4-1200.8,1226.2l-167.9,62.1v503.8v506.1l110.4-16.1C5653.3,2990.2,5796,2951.1,5908.7,2914.3z M5241.5,1067C5770.7,926.7,6095,381.5,5957-133.8c-75.9-285.3-283-529.1-559-660.2c-144.9-69-174.8-73.6-400.3-73.6c-232.3,0-248.4,2.3-414.1,85.1c-614.2,303.7-761.5,1072-301.4,1564.3C4528.4,1044,4905.7,1156.7,5241.5,1067z M3150.4-492.7c188.6-579.7,667.1-1058.2,1246.8-1246.9l119.6-41.4v-503.8v-503.8h-55.2c-29.9,0-147.2,27.6-257.7,59.8c-959.3,276.1-1723,1019.1-2019.8,1962.3c-34.5,108.1-69,239.2-75.9,294.5l-13.8,98.9h508.4H3109L3150.4-492.7z M7898.6-414.5c0-89.7-98.9-418.7-195.5-641.8C7367.2-1854.6,6649.4-2482.6,5796-2728.8c-110.4-32.2-227.7-59.8-257.6-59.8h-55.2v503.8v503.8l121.9,39.1c563.6,184,1062.8,683.2,1246.9,1249.2l39.1,119.6h503.8C7866.4-373.1,7898.6-375.4,7898.6-414.5z" />
                </g>
              </g>
            </svg>
          </SvgIcon>
        </IconButton>
      </span>
    </Tooltip>
  );
}
