import * as React from 'react';
import Box from '@mui/material/Box';
import StandardTextField from '@gdComponents/StandardTextField';
import {DirectionLength as Tool} from '@gd/NamedValues';
import InputAdornment from '@mui/material/InputAdornment';
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

export const DirectionLength = (props: Props) => {
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
        nx: 1,
        ny: 0,
        nz: 0,
        l: 0
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
      nx: sDp.nx,
      ny: sDp.ny,
      nz: sDp.nz,
      l: sDp.l,
      apply: false
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .required('')
        .variableNameFirstChar()
        .variableName()
        .noMathFunctionsName(),
      nx: Yup.string()
        .required('required')
        .gdFormulaIsValid()
        .test(
          'optionalDetail',
          'Zero norm is prohibited.',
          function test(value) {
            if (!value) return false;
            // eslint-disable-next-line react/no-this-in-sfc
            tool.nx.setValue(value);
            // eslint-disable-next-line react/no-this-in-sfc
            tool.ny.setValue(this.parent.ny);
            // eslint-disable-next-line react/no-this-in-sfc
            tool.nz.setValue(this.parent.nz);
            if (
              tool.nx.value === 0 &&
              tool.ny.value === 0 &&
              tool.nz.value === 0
            ) {
              return false;
            }
            return true;
          }
        ),
      ny: Yup.string().required('required').gdFormulaIsValid(),
      nz: Yup.string().required('required').gdFormulaIsValid(),
      l: Yup.string().required('required').gdFormulaIsValid(),
      apply: Yup.boolean().required()
    }),
    onSubmit: (values) => {
      tool.name = values.name;
      tool.nx.setValue(values.nx);
      tool.ny.setValue(values.ny);
      tool.nz.setValue(values.nz);
      tool.l.setValue(values.l);
      const dp = tool.getOffsetVector();
      setEvaluatedValue({
        x: toFixedNoZero(dp.dx) as string,
        y: toFixedNoZero(dp.dy) as string,
        z: toFixedNoZero(dp.dz) as string
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
    formik.handleSubmit();
  }, [formik]);

  React.useEffect(() => {
    setIsValid(formik.isValid);

    // formik.handleSubmit();
    if (!formik.isValid) {
      setEvaluatedValue({x: '', y: '', z: ''});
    }
  }, [formik.isValid, setIsValid]);

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
        <StandardTextField
          onChange={handleChange}
          label="name"
          name="name"
          size="small"
          sx={{
            margin: 1
          }}
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
        <FormLabel component="legend">Direction Vector</FormLabel>
        <Box
          component="div"
          sx={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <ValueField
            onChange={handleChange}
            unit=""
            label="NX"
            name="nx"
            variant="outlined"
            value={formik.values.nx}
            error={formik.touched.nx && Boolean(formik.errors.nx)}
            helperText={formik.touched.nx && formik.errors.nx}
            onBlur={formik.handleBlur}
            onKeyDown={onEnter}
          />
          <ValueField
            onChange={handleChange}
            unit=""
            label="NY"
            name="ny"
            variant="outlined"
            value={formik.values.ny}
            error={formik.touched.ny && Boolean(formik.errors.ny)}
            helperText={formik.touched.ny && formik.errors.ny}
            onBlur={formik.handleBlur}
            onKeyDown={onEnter}
          />
          <ValueField
            onChange={handleChange}
            unit=""
            label="NZ"
            name="nz"
            variant="outlined"
            value={formik.values.nz}
            error={formik.touched.nz && Boolean(formik.errors.nz)}
            helperText={formik.touched.nz && formik.errors.nz}
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
        <FormLabel component="legend">Length</FormLabel>
        <Box
          component="div"
          sx={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <ValueField
            onChange={handleChange}
            label="L"
            unit="mm"
            name="l"
            variant="outlined"
            value={formik.values.l}
            error={formik.touched.l && Boolean(formik.errors.l)}
            helperText={formik.touched.l && formik.errors.l}
            onBlur={formik.handleBlur}
            onKeyDown={onEnter}
            InputProps={{
              endAdornment: <InputAdornment position="end">mm</InputAdornment>
            }}
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
            disabled
            unit="mm"
            label="ΔX"
            name="nx"
            variant="outlined"
            value={evaluatedValue.x}
          />
          <ValueField
            disabled
            unit="mm"
            label="ΔY"
            name="ny"
            variant="outlined"
            value={evaluatedValue.y}
          />
          <ValueField
            disabled
            unit="mm"
            label="ΔZ"
            name="nz"
            variant="outlined"
            value={evaluatedValue.z}
          />
        </Box>
      </FormGroup>
    </FormControl>
  );
};
