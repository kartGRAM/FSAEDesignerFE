import * as React from 'react';
import {Avatar} from '@mui/material';
import {Handle, Position} from 'reactflow';
import {WarningBadge} from './WarningBadge';

export default function CircleNode(props: {
  data: {icon: JSX.Element};
  selected: boolean;
}) {
  const {data, selected} = props;
  const {icon} = data;

  return (
    <>
      <WarningBadge>
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
      </WarningBadge>
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
}
