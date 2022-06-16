import * as React from 'react';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import {IDataVector3} from '@gd/IElements';
import Typography from '@mui/material/Typography';

export interface Props {
  name: string;
  vector: IDataVector3;
}

interface ValueProps extends OutlinedTextFieldProps {}

const ValueField = (props: ValueProps) => {
  return (
    <TextField
      id="outlined-basic"
      size="small"
      // margin="none"
      {...props}
      InputProps={{
        endAdornment: <InputAdornment position="end">mm</InputAdornment>
      }}
      sx={{
        margin: 1,
        width: '15ch'
      }}
    />
  );
};

export default function Vector(props: Props) {
  // eslint-disable-next-line no-unused-vars
  const {name, vector} = props;
  if (!vector) return null;
  return (
    <Box sx={{padding: 1}}>
      <Typography>{name}</Typography>
      <ValueField label="X" variant="outlined" value={vector.x} />
      <ValueField label="Y" variant="outlined" value={vector.y} />
      <ValueField label="Z" variant="outlined" value={vector.z} />
    </Box>
  );
}
