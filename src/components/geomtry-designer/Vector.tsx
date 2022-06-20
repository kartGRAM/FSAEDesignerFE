import * as React from 'react';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import {Vector3, Matrix3} from '@gd/NamedValues';
import {IElement} from '@gd/IElements';
import Typography from '@mui/material/Typography';
import {useDispatch, useSelector} from 'react-redux';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';
import {RootState} from '@store/store';

export interface Props {
  parent: IElement;
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
  const {vector, offset, rotation, parent} = props;
  const rot = rotation ?? new Matrix3({name: 'rotation'});
  const ofs = offset ?? new Vector3({name: 'offset'});
  const dispatch = useDispatch();
  const coMatrix = useSelector(
    (state: RootState) => state.dgd.transCoordinateMatrix
  );

  const trans = (p: Vector3) => {
    const tmp = ofs
      .clone()
      .add(p.clone().applyMatrix3(rot))
      .applyMatrix3(new Matrix3(coMatrix));
    tmp.name = p.name;
    return tmp;
  };
  const handleFocus = () => {
    dispatch(setSelectedPoint({point: trans(vector).getData(parent)}));
  };
  const handleBlur = () => {};
  return (
    <Box sx={{padding: 1}} onFocus={handleFocus} onBlur={handleBlur}>
      <Typography>{vector.name}</Typography>
      <ValueField label="X" variant="outlined" value={vector.x} />
      <ValueField label="Y" variant="outlined" value={vector.y} />
      <ValueField label="Z" variant="outlined" value={vector.z} />
    </Box>
  );
}
