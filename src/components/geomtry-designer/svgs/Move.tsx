import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';

export default function Move(props: {
  onClick?: () => void;
  title: string;
  disabled?: boolean;
}) {
  const {onClick, title, disabled} = props;
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
      <IconButton
        disabled={disabled}
        onClick={() => {
          if (onClick) onClick();
        }}
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
              <g>
                <path d="M500,10c11.5,0,21.2,3.9,29,11.8l144.2,144.5c8.1,8.1,12.1,17.8,12.1,29s-4,20.9-12,28.9c-8,8-17.6,12-28.9,12s-20.9-4-29-12.1l-74.6-74.6v309.8h309.8l-74.6-74.6c-8.1-8.1-12.1-17.8-12.1-29s4-20.9,12-28.9c8-8,17.6-12,28.9-12c11.3,0,20.9,4,29,12.1L978.2,471c7.9,7.9,11.8,17.5,11.8,29s-3.9,21.1-11.8,28.7L833.7,673.2c-8.1,8.1-17.8,12.1-29,12.1c-11.3,0-20.9-4-28.9-12c-8-8-12-17.6-12-28.9s4-20.9,12.1-29l74.6-74.6H540.8v309.8l74.6-74.6c8.1-8.1,17.8-12.1,29-12.1c11.3,0,20.9,4,28.9,12c8,8,12,17.6,12,28.9c0,11.3-4,20.9-12.1,29L529,978.2c-7.9,7.9-17.5,11.8-29,11.8c-11.3,0-20.8-3.9-28.7-11.8L326.8,833.7c-8.1-8.1-12.1-17.8-12.1-29c0-11.3,4-20.9,12-28.9c8-8,17.6-12,28.9-12s20.9,4,29,12.1l74.6,74.6V540.8H149.4l74.6,74.6c8.1,8.1,12.1,17.8,12.1,29s-4,20.9-12,28.9c-8,8-17.6,12-28.9,12s-20.9-4-29-12.1L21.8,529c-7.9-7.9-11.8-17.5-11.8-29s3.9-21.2,11.8-29l144.5-144.2c8.1-8.1,17.8-12.1,29-12.1s20.9,4,28.9,12c8,8,12,17.6,12,28.9s-4,20.9-12.1,29l-74.6,74.6h309.8V149.4l-74.6,74.6c-8.1,8.1-17.8,12.1-29,12.1s-20.9-4-28.9-12c-8-8-12-17.6-12-28.9s4-20.9,12.1-29L471,21.8C478.8,13.9,488.5,10,500,10z" />
              </g>
            </g>
          </svg>
        </SvgIcon>
      </IconButton>
    </Tooltip>
  );
}
