import * as React from 'react';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import {getMatrix3, getDataVector3} from '@gd/IElements';
import Typography from '@mui/material/Typography';
import {useDispatch, useSelector} from 'react-redux';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';
import {Matrix3, Vector3} from 'three';
import {RootState} from '@store/store';

export interface Props {
  name: string;
  vector: Vector3;
  offset?: Vector3;
  rotation?: Matrix3;
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
  const {name, vector, offset, rotation} = props;
  const rot = rotation ?? new Matrix3();
  const ofs = offset ?? new Vector3();
  const dispatch = useDispatch();
  const coMatrix = useSelector(
    (state: RootState) => state.dgd.transCoordinateMatrix
  );
  if (!vector) return null;

  const trans = (p: Vector3) => {
    return ofs
      .clone()
      .add(p.clone().applyMatrix3(rot))
      .applyMatrix3(getMatrix3(coMatrix));
  };
  const handleFocus = () => {
    dispatch(setSelectedPoint({point: getDataVector3(trans(vector))}));
  };
  const handleBlur = () => {};
  return (
    <Box sx={{padding: 1}} onFocus={handleFocus} onBlur={handleBlur}>
      <Typography>{name}</Typography>
      <ValueField label="X" variant="outlined" value={vector.x} />
      <ValueField label="Y" variant="outlined" value={vector.y} />
      <ValueField label="Z" variant="outlined" value={vector.z} />
    </Box>
  );
}
