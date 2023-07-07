import * as React from 'react';
import Badge, {BadgeProps} from '@mui/material/Badge';
import WarningIcon from '@mui/icons-material/Warning';
import {styled} from '@mui/material/styles';

const StyledBadge = styled(Badge)<BadgeProps>(() => ({
  '& .MuiBadge-badge': {
    aspectRatio: '1',
    padding: '16px',
    borderRadius: '1000000px'
  }
}));

export function WarningBadge(props: {
  invisible?: boolean;
  children?: React.ReactNode;
}) {
  const {invisible, children} = props;
  return (
    <StyledBadge
      badgeContent={<WarningIcon />}
      color="warning"
      invisible={invisible}
    >
      {children}
    </StyledBadge>
  );
}
