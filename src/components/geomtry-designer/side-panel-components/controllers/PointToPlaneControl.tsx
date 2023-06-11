import React from 'react';
import store, {RootState} from '@store/store';
import {useSelector} from 'react-redux';
import {PointToPlaneControl} from '@gd/controls/PointToPlaneControl';
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
import {IElement} from '@gd/IElements';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import Select from '@mui/material/Select';
import Vector from '@gdComponents/Vector';

export interface PointToPlaneControlProps {
  control: PointToPlaneControl;
  setStaged: React.Dispatch<React.SetStateAction<null | IDataControl | string>>;
}

export function PointToPlaneControlSettings(props: PointToPlaneControlProps) {
  const {control, setStaged} = props;
  const [speed, setSpeed] = React.useState<number | ''>(control.speed);
  const [reverse, setReverse] = React.useState<boolean>(control.reverse);
  const max = 400;
  const min = 0;

  const [selectedID, setSelectedID] = React.useState<string>(
    control?.targetElement ?? ''
  );

  const [selectedPoint, setSelectedPoint] = React.useState<string>(
    control?.pointID ?? ''
  );

  const zindex = useSelector(
    (state: RootState) =>
      state.uitgd.fullScreenZIndex +
      state.uitgd.dialogZIndex +
      state.uitgd.menuZIndex
  );

  const state = store.getState();
  const elements = state.uitgd.collectedAssembly?.children ?? [];
  const elementsByClass = elements.reduce((prev, current) => {
    if (!(current.className in prev)) prev[current.className] = [];
    prev[current.className].push(current);
    return prev;
  }, {} as {[index: string]: IElement[]});
  const element = elements.find((element) => element.nodeID === selectedID);
  const points = element?.getPoints() ?? [];

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
    control.targetElement = selectedID;
    control.pointID = selectedPoint;
    control.speed = isNumber(speed) ? speed : 0;
    control.reverse = reverse;
    setStaged(control.getDataControl());
  }, [selectedID, selectedPoint, speed, reverse]);

  return (
    <>
      <Box
        component="div"
        sx={{display: 'flex', flexDirection: 'row', width: '100%', mt: 0.7}}
      >
        <FormControl sx={{minWidth: 320}}>
          <InputLabel htmlFor="component-select">Select a component</InputLabel>
          <Select
            value={selectedID}
            label="Select a component"
            MenuProps={{
              sx: {zIndex: zindex}
            }}
            onChange={(e) => {
              setSelectedID(e.target.value);
              if (e.target.value === '' && control) {
                setStaged(control.nodeID);
              }
            }}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {Object.keys(elementsByClass)
              .map((key) => [
                <ListSubheader key={key}>{key}</ListSubheader>,
                ...elementsByClass[key].map((element) => (
                  <MenuItem value={element.nodeID} key={element.nodeID}>
                    {element.name.value}
                  </MenuItem>
                ))
              ])
              .flat()}
          </Select>
        </FormControl>
        <FormControl sx={{ml: 3, minWidth: 320}}>
          <InputLabel htmlFor="component-select">Select a node</InputLabel>
          <Select
            value={selectedPoint}
            label="Select a node"
            MenuProps={{
              sx: {zIndex: zindex}
            }}
            onChange={(e) => {
              setSelectedPoint(e.target.value);
            }}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {points.map((p) => (
              <MenuItem value={p.nodeID} key={p.nodeID}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Vector
        vector={control.origin}
        disableSceneButton
        disablePointOffsetTool
      />
      <Vector
        vector={control.normal}
        disableSceneButton
        disablePointOffsetTool
      />
      <Box component="div" sx={{flexGrow: 1, mt: 0.7}}>
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
        sx={{display: 'flex', flexDirection: 'row', width: '100%', mt: 3}}
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
