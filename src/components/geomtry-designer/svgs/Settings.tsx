import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import SettingsIcon from '@mui/icons-material/Settings';
import store from '@store/store';

export const Settings = React.memo(
  (props: {onClick?: () => void; title: string; disabled?: boolean}) => {
    const {onClick, title, disabled} = props;
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
          >
            <SettingsIcon />
          </IconButton>
        </span>
      </Tooltip>
    );
  }
);
export default Settings;
