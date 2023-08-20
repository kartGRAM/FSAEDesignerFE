import * as React from 'react';
import {Box, Typography} from '@mui/material';
import {Handle, Position} from 'reactflow';
import {WarningBadge, ErrorBadge, CompletedBadge} from './Badge';

export type OvalNodeProps = {
  data: {
    icon?: JSX.Element;
    label: JSX.Element;
    source?: boolean;
    target?: boolean;
    warning: boolean;
    error: boolean;
    completed: boolean;
  };
  selected?: boolean;
};

export const OvalNode = React.memo((props: OvalNodeProps) => {
  const {data, selected} = props;
  const {icon, label, source, target, warning, completed, error} = data;
  return (
    <>
      <CompletedBadge invisible={!completed}>
        <WarningBadge invisible={!warning}>
          <ErrorBadge invisible={!error}>
            <Box
              component="div"
              sx={{
                p: 1,
                pl: 2,
                pr: 2,
                border: `solid ${selected ? '1.4px #000' : ' 0.7px #888'}`,
                borderRadius: '1000000px',
                bgcolor: '#FFF',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              {icon}
              <Typography variant="h5">{label}</Typography>
            </Box>
          </ErrorBadge>
        </WarningBadge>
      </CompletedBadge>
      {target ? (
        <Handle
          position={Position.Left}
          type="target"
          style={{width: '12px', height: '12px', left: '-6px'}}
        />
      ) : null}
      {source ? (
        <Handle
          position={Position.Right}
          type="source"
          style={{width: '12px', height: '12px', right: '-6px'}}
        />
      ) : null}
    </>
  );
});
export default OvalNode;
