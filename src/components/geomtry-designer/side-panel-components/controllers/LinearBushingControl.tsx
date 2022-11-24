/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {IControl} from '@gd/IControls';
import {ILinearBushing} from '@gd/IElements';
import {useDispatch} from 'react-redux';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';

export interface LinearBushingControlProps {
  control: IControl | undefined;
  element: ILinearBushing;
}

export function LinearBushingControl(props: LinearBushingControlProps) {
  const {control, element} = props;
  return (
    <Box
      component="div"
      sx={{display: 'flex', flexDirection: 'row', width: '100%'}}
    >
      <ValueField label="Speed" name="speed" variant="outlined" unit="mm/s" />
      <Box component="div" sx={{flexGrow: 1, mt: 0.7}}>
        <Slider
          size="small"
          defaultValue={70}
          aria-label="Small"
          valueLabelDisplay="auto"
        />
      </Box>
    </Box>
  );
}

// eslint-disable-next-line no-redeclare
interface MyOutlinedTextFieldProps extends OutlinedTextFieldProps {
  unit: string;
}

const ValueField = React.memo((props: MyOutlinedTextFieldProps) => {
  const {unit} = props;
  return (
    <TextField
      size="small"
      // margin="none"
      {...props}
      InputProps={{
        endAdornment: <InputAdornment position="end">{unit}</InputAdornment>
      }}
      sx={{
        marginRight: 3
        // width: '15ch'
      }}
    />
  );
});
