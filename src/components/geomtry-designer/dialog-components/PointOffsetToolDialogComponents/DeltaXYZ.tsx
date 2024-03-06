import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import {DeltaXYZ as Tool} from '@gd/NamedValues';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import {INamedVector3} from '@gd/INamedValues';
import {updateAssembly} from '@store/reducers/dataGeometryDesigner';
import {getRootAssembly} from '@gd/IElements';
import {useDispatch} from 'react-redux';
import {toFixedNoZero} from '@app/utils/helpers';
import {ValueField} from '@gdComponents/ValueField';

interface Props {
  name: string;
  setIsValid: React.Dispatch<React.SetStateAction<boolean>>;
  handleOK: {callback: () => void};
  onClose: () => void;
  tool?: Tool;
  vector: INamedVector3;
  indexOfTool: number;
}

export const DeltaXYZ = (props: Props) => {
  const {
    name,
    tool: toolInProps,
    setIsValid,
    handleOK,
    onClose,
    vector,
    indexOfTool
  } = props;
  const tool =
    toolInProps ??
    new Tool({
      value: {
        name,
        dx: 0,
        dy: 0,
        dz: 0
      },
      parent: vector
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
      tool.name = values.name;
      tool.dx.setValue(values.dx);
      tool.dy.setValue(values.dy);
      tool.dz.setValue(values.dz);
      setEvaluatedValue({
        x: toFixedNoZero(tool.dx.value) as string,
        y: toFixedNoZero(tool.dy.value) as string,
        z: toFixedNoZero(tool.dz.value) as string
      });
      // eslint-disable-next-line no-empty
      if (values.apply) {
        vector.pointOffsetTools![indexOfTool] = tool;
        dispatch(updateAssembly(getRootAssembly(vector)));
        onClose();
      }
    }
  });

  React.useEffect(() => {
    setIsValid(formik.isValid);

    formik.handleSubmit();
    if (!formik.isValid) {
      setEvaluatedValue({x: '', y: '', z: ''});
    }
  }, [formik, formik.isValid, setIsValid]);

  const onEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      formik.handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(e);
    setTimeout(() => formik.handleSubmit(), 0);
  };

  const handleOKCallback = () => {
    formik.values.apply = true;
    setTimeout(() => formik.handleSubmit(), 0);
  };

  handleOK.callback = handleOKCallback;

  return (
    <FormControl component="fieldset" variant="standard">
      <Box
        component="div"
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
          component="div"
          sx={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <ValueField
            onChange={handleChange}
            unit="mm"
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
            unit="mm"
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
            unit="mm"
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
          component="div"
          sx={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <ValueField
            unit="mm"
            disabled
            label="ΔX"
            name="dx"
            variant="outlined"
            value={evaluatedValue.x}
          />
          <ValueField
            unit="mm"
            disabled
            label="ΔY"
            name="dy"
            variant="outlined"
            value={evaluatedValue.y}
          />
          <ValueField
            unit="mm"
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
