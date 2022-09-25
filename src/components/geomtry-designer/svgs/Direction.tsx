import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';

export default function Direction(props: {
  onClick?: () => void;
  title: string;
}) {
  const {onClick, title} = props;
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
              <path d="M984.8,74.8L539.4,965.6c-7.9,16.2-21.1,24.4-39.7,24.4c-2.3,0-5.8-0.5-10.4-1.3c-10.2-2.3-18.4-7.6-24.7-15.7c-6.3-8.1-9.4-17.3-9.4-27.4V544.6H54.4c-10.2,0-19.4-3.2-27.5-9.4s-13.4-14.5-15.6-24.7c-2.3-10.2-1.4-20,2.8-29.3c4.2-9.3,10.9-16.3,20.2-20.9L924.9,14.9c6.1-3.2,12.8-4.9,20.2-4.9c12.6,0,23,4.4,31.4,13.2c6.9,6.5,11.3,14.5,12.9,24C991,56.8,989.4,66,984.8,74.8z" />
            </g>
          </svg>
        </SvgIcon>
      </IconButton>
    </Tooltip>
  );
}
