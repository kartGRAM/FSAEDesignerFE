import * as React from 'react';
import {Avatar} from '@mui/material';
import {Handle, Position} from 'reactflow';

export default function CircleNode(props: {data: {icon: JSX.Element}}) {
  const {data} = props;
  const {icon} = data;
  return (
    <>
      <Avatar sx={{border: 'solid 1px #333', bgcolor: '#FFF'}}>{icon}</Avatar>
      <Handle position={Position.Left} type="target" />
      <Handle position={Position.Right} type="source" />
    </>
  );
}
