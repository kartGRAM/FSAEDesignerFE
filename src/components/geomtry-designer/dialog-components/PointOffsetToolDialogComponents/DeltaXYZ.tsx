/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import Box from '@mui/material/Box';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import {DeltaXYZ as Tool, getDummyVector3} from '@gd/NamedValues';
import InputAdornment from '@mui/material/InputAdornment';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import {setPointOffsetToolDialogProps} from '@store/reducers/uiTempGeometryDesigner';

import {useDispatch} from 'react-redux';
import store from '@store/store';
import {toFixedNoZero} from '@app/utils/helpers';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import FormControlLabel from '@mui/material/FormControlLabel';

interface Props {
  name: string;
  setIsValid: React.Dispatch<React.SetStateAction<boolean>>;
  setHandleOK: React.Dispatch<React.SetStateAction<() => void>>;
  tool?: Tool;
}

export const DeltaXYZ = (props: Props) => {
  const {name, tool: toolProps, setIsValid, setHandleOK} = props;
  const tool =
    toolProps ??
    new Tool({
      value: {
        name,
        dx: 0,
        dy: 0,
        dz: 0
      },
      parent: getDummyVector3()
    });
  const sDp = tool.getStringValue();
  const [evaluatedValue, setEvaluatedValue] = React.useState({
    x: '',
    y: '',
    z: ''
  });
  const dispatch = useDispatch();

  const formik = useFormik({
    // enableReinitialize: true,
    initialValues: {
      name: tool.name,
      dx: sDp.dx,
      dy: sDp.dy,
      dz: sDp.dz,
      apply: false
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .required('')
        .variableNameFirstChar()
        .variableName()
        .noMathFunctionsName(),
      dx: Yup.string().required('required').gdFormulaIsValid(),
      dy: Yup.string().required('required').gdFormulaIsValid(),
      dz: Yup.string().required('required').gdFormulaIsValid(),
      apply: Yup.boolean().required()
    }),
    onSubmit: (values) => {
      tool.dx.setValue(values.dx);
      tool.dy.setValue(values.dy);
      tool.dz.setValue(values.dz);
      setEvaluatedValue({
        x: toFixedNoZero(tool.dx.value) as string,
        y: toFixedNoZero(tool.dy.value) as string,
        z: toFixedNoZero(tool.dz.value) as string
      });
      if (values.apply) {
        const props =
          store.getState().uitgd.gdDialogState.pointOffsetToolDialogProps;
        dispatch(setPointOffsetToolDialogProps({...props, open: false}));
      }
    }
  });

  React.useEffect(() => {
    const handleOK = () => {
      return () => {
        formik.values.apply = true;
        setTimeout(() => formik.handleSubmit(), 0);
      };
    };
    setIsValid(formik.isValid);
    setHandleOK(handleOK);
    formik.handleSubmit();
    if (!formik.isValid) {
      setEvaluatedValue({x: '', y: '', z: ''});
    }
  }, [formik.isValid]);

  const onEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      formik.handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(e);
    setTimeout(() => formik.handleSubmit(), 0);
  };

  return (
    <FormControl component="fieldset" variant="standard">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mt: 1
        }}
      >
        <TextField
          onChange={handleChange}
          label="name"
          name="name"
          size="small"
          sx={{
            margin: 1
          }}
          variant="standard"
          value={formik.values.name}
          error={formik.touched.name && Boolean(formik.errors.name)}
          helperText={formik.touched.name && formik.errors.name}
          onBlur={formik.handleBlur}
          onKeyDown={onEnter}
        />
      </Box>
      <FormGroup
        sx={{
          mt: 4
        }}
      >
        <FormLabel component="legend">Delta XYZ</FormLabel>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <ValueField
            onChange={handleChange}
            label="ΔX"
            name="dx"
            variant="outlined"
            value={formik.values.dx}
            error={formik.touched.dx && Boolean(formik.errors.dx)}
            helperText={formik.touched.dx && formik.errors.dx}
            onBlur={formik.handleBlur}
            onKeyDown={onEnter}
          />
          <ValueField
            onChange={handleChange}
            label="ΔY"
            name="dy"
            variant="outlined"
            value={formik.values.dy}
            error={formik.touched.dy && Boolean(formik.errors.dy)}
            helperText={formik.touched.dy && formik.errors.dy}
            onBlur={formik.handleBlur}
            onKeyDown={onEnter}
          />
          <ValueField
            onChange={handleChange}
            label="ΔZ"
            name="dz"
            variant="outlined"
            value={formik.values.dz}
            error={formik.touched.dz && Boolean(formik.errors.dz)}
            helperText={formik.touched.dz && formik.errors.dz}
            onBlur={formik.handleBlur}
            onKeyDown={onEnter}
          />
        </Box>
      </FormGroup>
      <FormGroup
        sx={{
          mt: 4
        }}
      >
        <FormLabel component="legend">Outputs</FormLabel>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <ValueField
            disabled
            label="ΔX"
            name="dx"
            variant="outlined"
            value={evaluatedValue.x}
          />
          <ValueField
            disabled
            label="ΔY"
            name="dy"
            variant="outlined"
            value={evaluatedValue.y}
          />
          <ValueField
            disabled
            label="ΔZ"
            name="dz"
            variant="outlined"
            value={evaluatedValue.z}
          />
        </Box>
      </FormGroup>
    </FormControl>
  );
};

const ValueField = (props: OutlinedTextFieldProps) => {
  return (
    <TextField
      size="small"
      // margin="none"
      {...props}
      InputProps={{
        endAdornment: <InputAdornment position="end">mm</InputAdornment>
      }}
      sx={{
        margin: 1
        // width: '15ch'
      }}
    />
  );
};
