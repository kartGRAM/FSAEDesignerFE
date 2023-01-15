import * as React from 'react';
import {Box} from '@mui/material';
import {Handle, Position} from 'reactflow';

export default function OvalNode(props: {
  data: {icon: JSX.Element; label: JSX.Element};
}) {
  const {data} = props;
  const {icon, label} = data;
  return (
    <>
      <Box component="div" sx={{border: 'solid 1px #333', bgcolor: '#FFF'}}>
        {icon}
        {label}
      </Box>
      <Handle position={Position.Left} type="target" />
      <Handle position={Position.Right} type="source" />
    </>
  );
}
