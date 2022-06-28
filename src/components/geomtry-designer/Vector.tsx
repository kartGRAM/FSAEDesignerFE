import React, {useEffect, useState} from 'react';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import {Vector3, Matrix3} from 'three';
import {NamedVector3, getMatrix3, getDataVector3} from '@gd/NamedValues';
import {IElement} from '@gd/IElements';
import Typography from '@mui/material/Typography';
import {useDispatch, useSelector} from 'react-redux';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';
import {updateAssembly} from '@store/reducers/dataGeometryDesigner';
import {RootState} from '@store/store';

export interface Props {
  element: IElement;
  vector: NamedVector3;
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
  const {element, vector, offset, rotation} = props;
  const rot = rotation ?? new Matrix3();
  const ofs = offset ?? new Vector3();
  const dispatch = useDispatch();
  const coMatrix = useSelector(
    (state: RootState) => state.dgd.transCoordinateMatrix
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [focused, setFocused] = useState<boolean>(false);

  useEffect(() => {
    if (focused)
      dispatch(setSelectedPoint({point: getDataVector3(trans(vector))}));
    return () => {
      if (!focused) dispatch(setSelectedPoint({point: null}));
    };
  }, [focused, vector]);

  const trans = (p: NamedVector3) => {
    return ofs
      .clone()
      .add(p.value.clone().applyMatrix3(rot))
      .applyMatrix3(getMatrix3(coMatrix));
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handleChangeX = (event: React.ChangeEvent<HTMLInputElement>) => {
    const {value} = event.target;
    const x = Number(value);
    vector.value = vector.value.setX(x);
    dispatch(updateAssembly({element}));
  };
  const handleChangeY = (event: React.ChangeEvent<HTMLInputElement>) => {
    const {value} = event.target;
    const x = Number(value);
    vector.value = vector.value.setY(x);
    dispatch(updateAssembly({element}));
  };
  const handleChangeZ = (event: React.ChangeEvent<HTMLInputElement>) => {
    const {value} = event.target;
    const x = Number(value);
    vector.value = vector.value.setZ(x);
    dispatch(updateAssembly({element}));
  };
  const handleBlur = () => {
    setFocused(false);
  };
  return (
    <Box sx={{padding: 1}} onFocus={handleFocus} onBlur={handleBlur}>
      <Typography>{vector.name}</Typography>
      <ValueField
        onChange={handleChangeX}
        label="X"
        variant="outlined"
        value={vector.value.x}
      />
      <ValueField
        onChange={handleChangeY}
        label="Y"
        variant="outlined"
        value={vector.value.y}
      />
      <ValueField
        onChange={handleChangeZ}
        label="Z"
        variant="outlined"
        value={vector.value.z}
      />
    </Box>
  );
}
