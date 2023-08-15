import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
// eslint-disable-next-line import/no-extraneous-dependencies
import {SxProps} from '@mui/system';
import {Theme} from '@mui/material/styles';
import store from '@store/store';

export default function CaseStart(props: {
  onClick?: () => void;
  onDoubleClick?: () => void;
  title: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}) {
  const {onClick, onDoubleClick, title, disabled, sx} = props;

  const {uitgd} = store.getState();
  const tooltipZIndex =
    uitgd.fullScreenZIndex + uitgd.dialogZIndex + uitgd.tooltipZIndex;
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
          onDoubleClick={() => {
            if (onDoubleClick) onDoubleClick();
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
                <path d="M10,495.3l351.8,328.3l628.2-647L10,495.3z" />
              </g>
            </svg>
          </SvgIcon>
        </IconButton>
      </span>
    </Tooltip>
  );
}
