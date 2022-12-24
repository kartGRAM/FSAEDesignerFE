/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {IThreePointsPlane} from '@gd/measure/IPlaneObjects';
import {ElementPoint as ElementPointObject} from '@gd/measure/PointObjects';
import {IDatumObject} from '@gd/measure/IDatumObjects';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import useUpdateEffect from '@app/hooks/useUpdateEffect';

export function ThreePointsPlane(props: {
  threePointsPlane?: IThreePointsPlane;
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {threePointsPlane, setApplyReady} = props;

  const dispatch = useDispatch();
  const id = React.useId();

  const handleChanged = (e: SelectChangeEvent<string>) => {};

  return (
    <Box component="div">
      <FormControl sx={{m: 1, minWidth: 200}}>
        <InputLabel htmlFor={id}>Select a Point</InputLabel>
        <Select native id={id} label="Select a point" onChange={handleChanged}>
          <option aria-label="None" value="" />
          {[].map((element: any) => (
            <optgroup label={element.name.value} key={element.nodeID}>
              {element.getMeasurablePoints().map((point: any) => (
                <option value={point.nodeID} key={point.nodeID}>
                  {point.name}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
