import * as React from 'react';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

export interface ValueFieldProps extends OutlinedTextFieldProps {
  unit: string;
}

export const ValueField = (props: ValueFieldProps) => {
  const {unit, sx} = props;
  return (
    <TextField
      size="small"
      // margin="none"
      {...props}
      InputProps={{
        endAdornment: <InputAdornment position="end">{unit}</InputAdornment>
      }}
      sx={{
        ...sx,
        margin: 1
        // width: '15ch'
      }}
    />
  );
};
