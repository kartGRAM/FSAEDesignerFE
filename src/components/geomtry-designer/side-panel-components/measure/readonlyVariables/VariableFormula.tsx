import Box from '@mui/material/Box';
import {useFormik} from 'formik';
import yup from '@app/utils/Yup';
import StandardTextField from '@gdComponents/StandardTextField';
import {Typography} from '@mui/material';
import {getDgd} from '@store/getDgd';
import {IReadonlyVariable} from '@gd/measure/readonlyVariables/IReadonlyVariable';
import {ReadonlyVariable} from '@gd/measure/readonlyVariables/ReadonlyVariable';

export function VariableFormula(props: {
  variable: IReadonlyVariable;
  setApplyReady: (variable: IReadonlyVariable) => void;
}) {
  const {variable, setApplyReady} = props;
  const formulae = [
    ...getDgd().formulae,
    ...variable.sources.map((source) => ({
      name: source.name,
      formula: `${source.value}`,
      absPath: ''
    }))
  ];

  const formik = useFormik({
    initialValues: {
      formula: variable.formula
    },
    validationSchema: yup.object({
      formula: yup
        .string()
        .required('')
        .gdFormulaIsValid(formulae, undefined, undefined)
    }),
    onSubmit: (values) => {
      variable.formula = values.formula;
      variable.update();
      setApplyReady(new ReadonlyVariable().copy(variable));
    }
  });

  const onEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      formik.handleSubmit();
    }
  };

  return (
    <Box
      component="div"
      sx={{
        display: 'flex',
        m: 1,
        flexGrow: 1,
        mt: 1,
        flexDirection: 'row',
        alignItems: 'baseline'
      }}
    >
      <StandardTextField
        label="user defined formula"
        sx={{flex: 2}}
        name="formula"
        onBlur={(e) => {
          formik.handleBlur(e);
          formik.handleSubmit();
        }}
        onKeyDown={onEnter}
        onChange={formik.handleChange}
        value={formik.values.formula}
        error={formik.touched.formula && formik.errors.formula !== undefined}
        helperText={formik.touched.formula && formik.errors.formula}
      />
      <Typography sx={{flex: 1}} align="right">{`${variable.value.toFixed(
        3
      )}`}</Typography>
    </Box>
  );
}
