import React, {useEffect, useState} from 'react';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import {Vector3, Matrix3} from 'three';
import {NamedVector3, getMatrix3, getDataVector3} from '@gd/NamedValues';
import Typography from '@mui/material/Typography';
import {useDispatch, useSelector} from 'react-redux';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';
import {updateAssembly} from '@store/reducers/dataGeometryDesigner';
import {RootState} from '@store/store';
import {useFormik} from 'formik';
import * as Yup from 'yup';

export interface Props {
  vector: NamedVector3;
  offset?: Vector3;
  rotation?: Matrix3;
}

interface ValueProps extends OutlinedTextFieldProps {
  name?: string;
  id?: string;
}

const ValueField = (props: ValueProps) => {
  const {name, id} = props;
  return (
    <TextField
      size="small"
      name={name}
      id={id}
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
  const {vector, offset, rotation} = props;
  const rot = rotation ?? new Matrix3();
  const ofs = offset ?? new Vector3();
  const dispatch = useDispatch();
  const coMatrix = useSelector(
    (state: RootState) => state.dgd.transCoordinateMatrix
  );

  const [focused, setFocused] = useState<boolean>(false);
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      x: vector.value.x,
      y: vector.value.y,
      z: vector.value.z
    },
    validationSchema: Yup.object({
      x: Yup.number().typeError('not a number'),
      y: Yup.number().typeError('not a number'),
      z: Yup.number().typeError('not a number')
    }),
    onSubmit: (values) => {
      vector.value = new Vector3(values.x, values.y, values.z);
      dispatch(updateAssembly({element: vector.parent}));
    }
  });

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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(event);
    setTimeout(formik.handleSubmit, 0);
  };
  const handleBlur = () => {
    setFocused(false);
  };
  return (
    <Box sx={{padding: 1}} onFocus={handleFocus} onBlur={handleBlur}>
      <form onSubmit={formik.handleSubmit}>
        <Typography>{vector.name}</Typography>
        <ValueField
          onChange={handleChange}
          label="X"
          name="x"
          variant="outlined"
          value={formik.values.x}
          error={formik.touched.x && Boolean(formik.errors.x)}
          helperText={formik.touched.x && formik.errors.x}
        />
        <ValueField
          onChange={handleChange}
          label="Y"
          name="y"
          variant="outlined"
          value={formik.values.y}
          error={formik.touched.y && Boolean(formik.errors.y)}
          helperText={formik.touched.y && formik.errors.y}
        />
        <ValueField
          onChange={handleChange}
          label="Z"
          name="z"
          variant="outlined"
          value={formik.values.z}
          error={formik.touched.z && Boolean(formik.errors.z)}
          helperText={formik.touched.z && formik.errors.z}
        />
      </form>
    </Box>
  );
}
