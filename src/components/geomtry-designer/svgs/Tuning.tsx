import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
// eslint-disable-next-line import/no-extraneous-dependencies
import {SxProps} from '@mui/system';
import {Theme} from '@mui/material/styles';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';

export default function Tuning(props: {
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
                <path d="M220,238.7v-197c0-17.5-14.2-31.7-31.7-31.7h-76.5C94.2,10,80,24.2,80,41.7v197C38.2,262.9,10,308.2,10,360s28.2,97.1,70,121.3v477c0,17.5,14.2,31.7,31.7,31.7h76.5c17.5,0,31.7-14.2,31.7-31.7v-477c41.8-24.2,70-69.4,70-121.3S261.8,262.9,220,238.7z M150,432.8c-40.1,0-72.8-32.7-72.8-72.8c0-40.1,32.7-72.8,72.8-72.8c40.1,0,72.8,32.7,72.8,72.8S190.1,432.8,150,432.8z" />
                <path d="M570,518.7v-477c0-17.5-14.2-31.7-31.7-31.7h-76.5C444.2,10,430,24.2,430,41.7v477c-41.8,24.2-70,69.4-70,121.3c0,51.8,28.2,97.1,70,121.3v197c0,17.5,14.2,31.7,31.7,31.7h76.5c17.5,0,31.7-14.2,31.7-31.7v-197c41.8-24.2,70-69.4,70-121.3S611.8,542.9,570,518.7z M500,712.8c-40.1,0-72.8-32.7-72.8-72.8c0-40.1,32.7-72.8,72.8-72.8c40.1,0,72.8,32.7,72.8,72.8C572.8,680.1,540.1,712.8,500,712.8z" />
                <path d="M990,290c0-51.8-28.2-97.1-70-121.3v-127c0-17.5-14.2-31.7-31.7-31.7h-76.5C794.2,10,780,24.2,780,41.7v127c-41.8,24.2-70,69.4-70,121.3c0,51.8,28.2,97.1,70,121.3v547c0,17.5,14.2,31.7,31.7,31.7h76.5c17.5,0,31.7-14.2,31.7-31.7v-547C961.8,387.1,990,341.8,990,290z M850,362.8c-40.1,0-72.8-32.7-72.8-72.8c0-40.1,32.7-72.8,72.8-72.8s72.8,32.7,72.8,72.8C922.8,330.1,890.1,362.8,850,362.8z" />
              </g>
            </svg>
          </SvgIcon>
        </IconButton>
      </span>
    </Tooltip>
  );
}
