import * as React from 'react';
import {Avatar} from '@mui/material';
import {Handle, Position} from 'reactflow';
import {WarningBadge, ErrorBadge, CompletedBadge} from './Badge';

export type CircleNodeProps = {
  data: {
    icon: JSX.Element;
    warning: boolean;
    error: boolean;
    completed: boolean;
  };
  selected?: boolean;
};

export const CircleNode = React.memo((props: CircleNodeProps) => {
  const {data, selected} = props;
  const {icon, error, completed, warning} = data;

  return (
    <>
      <CompletedBadge invisible={!completed}>
        <WarningBadge invisible={!warning}>
          <ErrorBadge invisible={!error}>
            <Avatar
              draggable
              sx={{
                border: `solid ${selected ? '1.4px #000' : ' 0.7px #888'}`,
                bgcolor: '#FFF'
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              {icon}
            </Avatar>
          </ErrorBadge>
        </WarningBadge>
      </CompletedBadge>
      <Handle
        position={Position.Left}
        type="target"
        style={{
          width: '12px',
          height: '12px',
          left: '-8px'
        }}
      />
      <Handle
        position={Position.Right}
        type="source"
        style={{width: '12px', height: '12px', right: '-8px'}}
      />
    </>
  );
});
export default CircleNode;
