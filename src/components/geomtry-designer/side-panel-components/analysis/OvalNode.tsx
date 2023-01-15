import * as React from 'react';
import {Box, Typography} from '@mui/material';
import {Handle, Position} from 'reactflow';

export default function OvalNode(props: {
  data: {
    icon?: JSX.Element;
    label: JSX.Element;
    source?: boolean;
    target?: boolean;
  };
  selected: boolean;
}) {
  const {data, selected} = props;
  const {icon, label, source, target} = data;
  return (
    <>
      <Box
        component="div"
        sx={{
          p: 1,
          pl: 1.5,
          pr: 1.5,
          border: `solid ${selected ? '1.4px #000' : ' 0.7px #888'}`,
          borderRadius: '1000000px',
          bgcolor: '#FFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {icon}
        <Typography variant="h5">{label}</Typography>
      </Box>
      {target ? <Handle position={Position.Left} type="target" /> : null}
      {source ? <Handle position={Position.Right} type="source" /> : null}
    </>
  );
}
