import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
// eslint-disable-next-line import/no-extraneous-dependencies
import {SxProps} from '@mui/system';
import {Theme} from '@mui/material/styles';

export default function CaseEnd(props: {
  onClick?: () => void;
  title: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}) {
  const {onClick, title, disabled, sx} = props;
  return (
    <Tooltip
      title={title}
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
                <path d="M959.4,285.6C833.5,332,737.5,365,653.1,469.4c-75.2,93-183.8,125.3-306.3,63.9v334.2h-61.2V40.6c0-16.9,13.7-30.6,30.6-30.6s30.6,13.7,30.6,30.6c68,98.9,186.2,120.8,306.3,122.5C836.9,165.8,959.4,285.6,959.4,285.6z M408.1,691.9v62.3c72.3,14.8,122.5,46.1,122.5,82.7c0,50.7-96,91.9-214.4,91.9c-118.4,0-214.4-41.2-214.4-91.9c0-36.5,50.2-67.9,122.5-82.7v-62.3c-111.3,19.3-183.7,73.2-183.7,145C40.6,927,154,990,316.2,990c162.3,0,275.6-63,275.6-153.1C591.9,765.1,519.4,711.1,408.1,691.9z" />
              </g>
            </svg>
          </SvgIcon>
        </IconButton>
      </span>
    </Tooltip>
  );
}
