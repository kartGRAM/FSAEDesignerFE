import React from 'react';
import {BasePlane, IFromBasePlane} from '@gd/measure/datum/IPlaneObjects';
import {FromBasePlane as FromBasePlaneObject} from '@gd/measure/datum/PlaneObjects';
import {IDatumObject} from '@gd/measure/datum/IDatumObjects';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Scalar from '@gdComponents/Scalar';
import {NamedNumber} from '@gd/NamedValues';
import store from '@store/store';
import useUpdateEffect from '@hooks/useUpdateEffect';

const directions: BasePlane[] = ['XY', 'YZ', 'ZX'];

export function FromBasePlane(props: {
  plane?: IFromBasePlane;
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {plane, setApplyReady} = props;

  const ids = [React.useId()];

  const [distance, setDistance] = React.useState(
    new NamedNumber({value: plane?.distance.getStringValue() ?? 0})
  );
  const [direction, setDirection] = React.useState<BasePlane | ''>(
    plane?.direction ?? ''
  );

  useUpdateEffect(() => {
    if (direction !== '') {
      const obj: IFromBasePlane = new FromBasePlaneObject({
        name: `datum plane`,
        distance: distance.getStringValue(),
        direction
      });
      setApplyReady(obj);
    } else {
      setApplyReady(undefined);
    }
  }, [distance, direction]);

  const {uitgd} = store.getState();
  const menuZIndex =
    uitgd.fullScreenZIndex + uitgd.menuZIndex + uitgd.dialogZIndex;

  return (
    <Box component="div">
      <FormControl
        sx={{
          m: 1,
          mt: 3,
          minWidth: 250,
          display: 'flex',
          flexDirection: 'row'
        }}
      >
        <InputLabel htmlFor={ids[0]}>Select direction</InputLabel>
        <Select
          value={direction}
          id={ids[0]}
          label="Select direction"
          onChange={(e) => setDirection(e.target.value as BasePlane)}
          sx={{flexGrow: '1'}}
          MenuProps={{
            sx: {zIndex: menuZIndex}
          }}
        >
          <MenuItem aria-label="None" value="">
            <em>None</em>
          </MenuItem>
          {directions.map((direction) => (
            <MenuItem value={direction} key={direction}>
              {direction}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Scalar
        value={distance}
        unit="mm"
        onUpdate={() => {
          setDistance(
            new NamedNumber({
              name: 'distance',
              value: distance.getStringValue()
            })
          );
        }}
      />
    </Box>
  );
}
