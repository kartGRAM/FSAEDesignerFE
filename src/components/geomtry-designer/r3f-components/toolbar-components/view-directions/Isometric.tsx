import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
import {setViewDirection} from '@store/reducers/uiTempGeometryDesigner';
import {Vector3} from 'three';
import {useDispatch} from 'react-redux';
import store from '@store/store';
import {getCameraQuaternion} from '@utils/three';

export default function Isometric(props: {onClick?: () => void}) {
  const {onClick} = props;
  const dispatch = useDispatch();

  const {uitgd} = store.getState();
  const zIndex = uitgd.fullScreenZIndex + uitgd.tooltipZIndex;
  return (
    <Tooltip
      title="Isometric View"
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
          dispatch(
            setViewDirection(
              getCameraQuaternion(new Vector3(-1, -1, -1))
              /* new Quaternion(
                -0.27984814233312133,
                0.3647051996310008,
                0.11591689595929511,
                0.8804762392171493
              ) */
            )
          );
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
              <path d="M920,250.6L506,11.6c-3.7-2.1-8.3-2.1-12,0l-414,239c-3.7,2.1-6,6.1-6,10.4v478c0,4.3,2.3,8.3,6,10.4l414,239c1.8,1.1,3.9,1.6,6,1.6c2.1,0,4.2-0.5,6-1.6l413.9-239c3.7-2.2,6-6.1,6-10.4V261C926,256.7,923.7,252.7,920,250.6z M500,35.9L889.9,261L500,486.1L110.1,261L500,35.9z M98.1,281.8L223,353.9l265,153v450.2L98.1,732.1V281.8z M901.9,732.1L512,957.2V506.9l265-153l124.9-72.1V732.1z" />
            </g>
          </svg>
        </SvgIcon>
      </IconButton>
    </Tooltip>
  );
}
