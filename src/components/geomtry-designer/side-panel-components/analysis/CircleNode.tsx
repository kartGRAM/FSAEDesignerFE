import * as React from 'react';
import {Avatar} from '@mui/material';
import {Handle, Position} from 'reactflow';

export default function CircleNode(props: {
  data: {icon: JSX.Element};
  selected: boolean;
}) {
  const {data, selected} = props;
  const {icon} = data;
  return (
    <>
      <Avatar
        sx={{
          border: `solid ${selected ? '1.4px #000' : ' 0.7px #888'}`,
          bgcolor: '#FFF'
        }}
      >
        {icon}
      </Avatar>
      <Handle position={Position.Left} type="target" />
      <Handle position={Position.Right} type="source" />
    </>
  );
}
