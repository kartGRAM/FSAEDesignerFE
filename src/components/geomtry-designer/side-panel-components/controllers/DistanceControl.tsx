import React from 'react';
import {DistanceControl} from '@gd/controls/DistanceControl';
import {IDataControl} from '@gd/controls/IControls';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import {isNumber} from '@app/utils/helpers';
import useUpdateEffect from '@app/hooks/useUpdateEffect';
import {ValueField} from '@gdComponents/ValueField';

export interface DistanceControlProps {
  control: DistanceControl;
  setStaged: React.Dispatch<React.SetStateAction<null | IDataControl | string>>;
}

export function DistanceControlSettings(props: DistanceControlProps) {
  const {control, setStaged} = props;
  const [speed, setSpeed] = React.useState<number | ''>(control.speed);
  const [reverse, setReverse] = React.useState<boolean>(control.reverse);
  const max = 400;
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

  const handleReverseChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    setReverse(checked);
  };

  useUpdateEffect(() => {
    control.speed = isNumber(speed) ? speed : 0;
    control.reverse = reverse;
    setStaged(control.getDataControl());
  }, [speed, reverse]);

  return (
    <>
      <Box
        component="div"
        sx={{display: 'flex', flexDirection: 'row', width: '100%'}}
      >
        <Box component="div" sx={{flexGrow: 1, mt: 0.7}}>
          <Slider
            size="small"
            aria-label="Small"
            valueLabelDisplay="auto"
            value={isNumber(speed) ? speed : 0}
            min={min}
            max={max}
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
          InputProps={{
            type: 'number',
            'aria-labelledby': 'input-slider',
            inputProps: {min, max, step: 1}
          }}
          sx={{
            marginLeft: 3
          }}
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
