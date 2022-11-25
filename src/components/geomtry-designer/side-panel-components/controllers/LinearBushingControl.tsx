/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {IControl} from '@gd/IControls';
import {ILinearBushing} from '@gd/IElements';
import {useDispatch} from 'react-redux';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import {InputBaseComponentProps} from '@mui/material/InputBase';
import {isNumber} from '@app/utils/helpers';

export interface LinearBushingControlProps {
  control: IControl | undefined;
  element: ILinearBushing;
}

export function LinearBushingControl(props: LinearBushingControlProps) {
  const {control, element} = props;
  const [speed, setSpeed] = React.useState<number | ''>(10);
  const max = 100;
  const min = 0;

  const handleSliderSpeedChange = (
    event: Event,
    newValue: number | number[]
  ) => {
    if (!isNumber(newValue)) newValue = newValue.shift() ?? 0;
    setSpeed(newValue);
  };
  const handleInputSpeedChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSpeed(event.target.value === '' ? '' : Number(event.target.value));
  };

  const handleBlur = () => {
    if (isNumber(speed) && speed < min) setSpeed(min);
  };

  return (
    <Box
      component="div"
      sx={{display: 'flex', flexDirection: 'row', width: '100%'}}
    >
      <Box component="div" sx={{flexGrow: 1, mt: 0.7}}>
        <Slider
          size="small"
          defaultValue={10}
          aria-label="Small"
          valueLabelDisplay="auto"
          value={isNumber(speed) ? speed : 0}
          onChange={handleSliderSpeedChange}
        />
      </Box>
      <ValueField
        value={speed}
        onChange={handleInputSpeedChange}
        onBlur={handleBlur}
        label="Speed"
        name="speed"
        variant="outlined"
        unit="mm/s"
        defaultValue={10}
        inputProps={{min, max, step: 1}}
      />
    </Box>
  );
}

// eslint-disable-next-line no-redeclare
interface MyOutlinedTextFieldProps extends OutlinedTextFieldProps {
  unit: string;
  inputProps?: InputBaseComponentProps;
}

const ValueField = React.memo((props: MyOutlinedTextFieldProps) => {
  const {unit, inputProps} = props;
  return (
    <TextField
      size="small"
      // margin="none"
      {...props}
      InputProps={{
        endAdornment: <InputAdornment position="end">{unit}</InputAdornment>,
        type: 'number',
        'aria-labelledby': 'input-slider',
        inputProps
      }}
      sx={{
        marginLeft: 3
        // width: '15ch'
      }}
    />
  );
});
