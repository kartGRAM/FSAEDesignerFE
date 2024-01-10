import React from 'react';
import {ExistingConstraintControl} from '@gd/controls/ExistingConstraintControl';
import {isDataPointToPlaneControl} from '@gd/controls/PointToPlaneControl';
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
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
// import ListSubheader from '@mui/material/ListSubheader';
import Select from '@mui/material/Select';
import store, {RootState} from '@store/store';
import {useSelector} from 'react-redux';

export interface ExistingConstraintControlProps {
  control: ExistingConstraintControl;
  setStaged: React.Dispatch<React.SetStateAction<null | IDataControl | string>>;
}

export function ExistingConstraintControlSettings(
  props: ExistingConstraintControlProps
) {
  const {control, setStaged} = props;
  const [speed, setSpeed] = React.useState<number | ''>(control.speed);
  const [reverse, setReverse] = React.useState<boolean>(control.reverse);
  const max = 400;
  const min = 0;

  const [selectedID, setSelectedID] = React.useState<string>(
    control?.targetControl ?? ''
  );
  const assemblyMode = useSelector(
    (state: RootState) => state.dgd.present.options.assemblyMode
  );
  const controls = useSelector(
    (state: RootState) => state.dgd.present.controls
  ).filter(
    (control) =>
      isDataPointToPlaneControl(control) &&
      (control.configuration ?? 'FixedFrame') === assemblyMode
  );

  const {uitgd} = store.getState();
  const zindex = uitgd.fullScreenZIndex + uitgd.dialogZIndex + uitgd.menuZIndex;

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
    control.targetControl = selectedID;
    setStaged(control.getDataControl());
  }, [selectedID, speed, reverse]);

  return (
    <>
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          mt: 0.7,
          ml: 2
        }}
      >
        <FormControl sx={{minWidth: 320}}>
          <InputLabel htmlFor="component-select">Select a control</InputLabel>
          <Select
            value={selectedID}
            label="Select a component"
            MenuProps={{
              sx: {zIndex: zindex}
            }}
            onChange={(e) => {
              setSelectedID(e.target.value);
            }}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {controls.map((control) => (
              <MenuItem value={control.nodeID} key={control.nodeID}>
                {control.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
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
