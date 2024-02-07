import React from 'react';
import {SkidpadSolverControl} from '@gd/controls/SkidpadSolverControl';
import {IDataControl} from '@gd/controls/IControls';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import {InputBaseComponentProps} from '@mui/material/InputBase';
import {isNumber} from '@app/utils/helpers';
import useUpdateEffect from '@app/hooks/useUpdateEffect';
import Scalar from '@gdComponents/Scalar';
import {NamedNumber} from '@gd/NamedValues';

export interface SkidpadSolverControlProps {
  control: SkidpadSolverControl;
  setStaged: React.Dispatch<React.SetStateAction<null | IDataControl | string>>;
}

export function SkidpadSolverControlSettings(props: SkidpadSolverControlProps) {
  const {control, setStaged} = props;
  const [speed, setSpeed] = React.useState<number | ''>(control.speed);
  const [reverse, setReverse] = React.useState<boolean>(control.reverse);
  const speedMax = 100;
  const speedMin = 0;

  const [min, setMin] = React.useState(new NamedNumber({value: control.minV}));

  const [max, setMax] = React.useState(new NamedNumber({value: control.maxV}));

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
    if (isNumber(speed) && speed < speedMin) setSpeed(speedMin);
  };

  const handleReverseChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    setReverse(checked);
  };

  useUpdateEffect(() => {
    control.speed = isNumber(speed) ? speed : 0;
    control.reverse = reverse;
    control.minV.setValue(min.getStringValue());
    control.maxV.setValue(max.getStringValue());
    setStaged(control.getDataControl());
  }, [speed, reverse, origin, min, max]);

  return (
    <>
      <Box
        component="div"
        sx={{display: 'flex', flexDirection: 'row', width: '100%'}}
      >
        <Scalar
          value={min}
          onUpdate={() => {
            setMin(
              new NamedNumber({
                name: 'min',
                value: min.getStringValue()
              })
            );
          }}
          unit="mm"
        />
        <Scalar
          value={max}
          onUpdate={() => {
            setMax(
              new NamedNumber({
                name: 'max',
                value: max.getStringValue()
              })
            );
          }}
          unit="mm"
        />
      </Box>

      <Box
        component="div"
        sx={{display: 'flex', flexDirection: 'row', width: '100%', mt: 3}}
      >
        <Box component="div" sx={{flexGrow: 1, mt: 0.7}}>
          <Slider
            size="small"
            aria-label="Small"
            valueLabelDisplay="auto"
            value={isNumber(speed) ? speed : 0}
            min={speedMin}
            max={speedMax}
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
          inputProps={{min, max, step: 1}}
        />
      </Box>
      <Box
        component="div"
        sx={{display: 'flex', flexDirection: 'row', width: '100%'}}
      >
        <FormControlLabel
          control={
            <Checkbox checked={reverse} onChange={handleReverseChange} />
          }
          label="Reverse Direction"
        />
      </Box>
    </>
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
