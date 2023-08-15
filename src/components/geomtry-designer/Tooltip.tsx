import React from 'react';
import MuiTooltip from '@mui/material/Tooltip';
import store from '@store/store';

export const Tooltip = React.memo(
  (props: {children: JSX.Element; title: string}) => {
    const {children, title} = props;

    const {uitgd} = store.getState();
    const zIndex = uitgd.fullScreenZIndex + uitgd.tooltipZIndex;
    return (
      <MuiTooltip
        title={title}
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
        <span>{children}</span>
      </MuiTooltip>
    );
  }
);
export default Tooltip;
