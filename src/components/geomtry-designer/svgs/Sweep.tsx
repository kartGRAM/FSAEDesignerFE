import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
// eslint-disable-next-line import/no-extraneous-dependencies
import {SxProps} from '@mui/system';
import {Theme} from '@mui/material/styles';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';

export default function Sweep(props: {
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
                <path d="M735.9,330v545.2h72.6V330H990L772.2,112.2L554.4,330H735.9L735.9,330z M10,64.4h108.9V137H10V64.4L10,64.4z M155.2,64.4h108.9V137H155.2V64.4L155.2,64.4z M300.4,64.4H373v108.9h-72.6V64.4L300.4,64.4z M10,318.5h72.6v108.9H10V318.5L10,318.5z M118.9,354.8h108.9v72.6H118.9V354.8L118.9,354.8z M264.1,354.8H373v72.6H264.1V354.8L264.1,354.8z M10,173.3h72.6v108.9H10V173.3L10,173.3z M300.4,209.6H373v108.9h-72.6V209.6L300.4,209.6z M300.4,645.2V863H82.6V645.2H300.4L300.4,645.2z M373,572.6H10v363h363V572.6L373,572.6z" />
              </g>
            </svg>
          </SvgIcon>
        </IconButton>
      </span>
    </Tooltip>
  );
}
