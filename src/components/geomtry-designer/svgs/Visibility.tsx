import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';

export default function Visibility(props: {
  onClick?: () => void;
  visible: boolean;
  title?: string;
  disabled?: boolean;
}) {
  const {onClick, title, visible, disabled} = props;
  return (
    <Tooltip
      title={title ?? visible ? 'hide' : 'show'}
      componentsProps={{
        popper: {
          sx: {
            zIndex: 12500000000
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
        >
          <SvgIcon sx={{color: '#666'}}>
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
                <path d="M500,792.4c-61.4,0-124.9-14.8-188.8-44c-50.4-23-101.2-55-150.9-95C76.1,585.5,24.2,518.5,22,515.7L10,500l12-15.6c2.2-2.8,54.1-69.9,138.3-137.7c49.7-40.1,100.5-72,150.9-95c63.9-29.2,127.4-44,188.8-44c61.4,0,124.9,14.8,188.8,44c50.4,23,101.2,55,150.9,95c84.2,67.8,136.1,134.9,138.3,137.7l12,15.6l-12,15.6c-2.2,2.8-54.1,69.9-138.3,137.7c-49.8,40.1-100.5,72-150.9,95C624.9,777.6,561.4,792.4,500,792.4z M75.5,500C95.3,523.3,137,569,193.3,614.2c46.3,37.2,93.3,66.8,139.7,87.9c57,25.9,113.1,39.1,166.9,39.1c53.8,0,109.9-13.2,166.9-39.1c46.4-21.1,93.4-50.7,139.7-87.9c56.3-45.2,98-90.9,117.9-114.1c-19.8-23.2-61.5-68.9-117.9-114.1c-46.3-37.2-93.3-66.8-139.7-87.9c-57-25.9-113.1-39.1-166.9-39.1c-53.8,0-109.9,13.2-166.9,39.1c-46.4,21.1-93.4,50.7-139.7,87.9C137,431.1,95.3,476.8,75.5,500z" />
                <path d="M502.7,704.5c-112.7,0-204.4-91.7-204.4-204.4c0-112.7,91.7-204.4,204.4-204.4c112.7,0,204.4,91.7,204.4,204.4C707.1,612.8,615.4,704.5,502.7,704.5z M502.7,346.9c-84.5,0-153.2,68.7-153.2,153.2c0,84.5,68.7,153.2,153.2,153.2c84.5,0,153.2-68.7,153.2-153.2C655.9,415.6,587.2,346.9,502.7,346.9z" />
                {!visible ? (
                  <path d="M785.6,180.4l36.7,36.7L219.7,819.6l-36.7-36.7L785.6,180.4z" />
                ) : null}
              </g>
            </svg>
          </SvgIcon>
        </IconButton>
      </span>
    </Tooltip>
  );
}
