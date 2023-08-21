import * as React from 'react';
import MUIBadge, {BadgeProps} from '@mui/material/Badge';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import {styled} from '@mui/material/styles';

const StyledBadge = styled(MUIBadge)<BadgeProps>(() => ({
  '& .MuiBadge-badge': {
    aspectRatio: '1',
    padding: '12px',
    borderRadius: '1000000px'
  }
}));

const StyledBadge2 = styled(MUIBadge)<BadgeProps>(() => ({
  '& .MuiBadge-badge': {
    aspectRatio: '1',
    paddingTop: '0.12rem',
    // padding: '11.5px',
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
      badgeContent={<WarningIcon fontSize="small" sx={{pb: '2px'}} />}
      color="warning"
      invisible={invisible}
    >
      {children}
    </StyledBadge>
  );
}

export function ErrorBadge(props: {
  invisible?: boolean;
  children?: React.ReactNode;
}) {
  const {invisible, children} = props;
  return (
    <StyledBadge2
      badgeContent={<ErrorIcon fontSize="small" sx={{pb: '2px'}} />}
      color="error"
      invisible={invisible}
    >
      {children}
    </StyledBadge2>
  );
}

export function CompletedBadge(props: {
  invisible?: boolean;
  children?: React.ReactNode;
}) {
  const {invisible, children} = props;
  return (
    <StyledBadge2
      badgeContent={<CheckCircleIcon fontSize="small" sx={{pb: '2px'}} />}
      color="success"
      invisible={invisible}
    >
      {children}
    </StyledBadge2>
  );
}
