/* eslint-disable no-nested-ternary */
import React, {useState} from 'react';
import {OutlinedTextFieldProps} from '@mui/material/TextField';
import Box from '@mui/material/Box';
import {INamedNumber} from '@gd/INamedValues';
import Typography from '@mui/material/Typography';
import {useDispatch} from 'react-redux';
import {updateAssembly} from '@store/reducers/dataGeometryDesigner';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import Toolbar from '@mui/material/Toolbar';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import {getRootAssembly} from '@gd/IElements';
import {toFixedNoZero, isNumber} from '@app/utils/helpers';
import {setControlDisabled} from '@store/reducers/uiTempGeometryDesigner';
import EditableTypography from '@gdComponents/EditableTypography';
import {ValueField} from './ValueField';

export default function Scalar(props: {
  value: INamedNumber;
  unit: string;
  removable?: boolean;
  onRemove?: () => void;
  onFocusChanged?: (focus: boolean) => () => void;
  disabled?: boolean;
  onUpdate?: () => void;
  nameUnvisible?: boolean;
  min?: number;
  max?: number;
  valueFieldProps?: Omit<OutlinedTextFieldProps, 'variant'>;
}) {
  const {
    value,
    unit,
    removable,
    onRemove,
    onFocusChanged,
    disabled,
    onUpdate,
    nameUnvisible,
    min,
    max,
    valueFieldProps
  } = props;
  const dispatch = useDispatch();
  const sValue = value.getStringValue();

  const [focused, setFocused] = useState<boolean>(false);

  let schema = Yup.string().gdFormulaIsValid();
  if (min) schema = schema.gdFormulaMin(min);
  if (max) schema = schema.gdFormulaMax(max);
  schema = schema.required('required');

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      value: sValue
    },
    validationSchema: Yup.object({
      value: schema
    }),
    onSubmit: (values) => {
      value.setValue(values.value);
      if (value.parent) dispatch(updateAssembly(getRootAssembly(value)));
      if (onUpdate) onUpdate();
    }
  });

  // eslint-disable-next-line consistent-return
  React.useEffect(() => {
    if (onFocusChanged) return onFocusChanged(focused);
  }, [focused, onFocusChanged, value]);

  const ref = React.useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    setFocused(true);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(event);
    setTimeout(formik.handleSubmit, 0);
  };

  const onFocus = React.useCallback(() => {
    dispatch(setControlDisabled(true));
  }, [dispatch]);

  const handleBlur = () => {
    setFocused(false);
  };

  return (
    <Box
      component="div"
      sx={{padding: 1}}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {!nameUnvisible || removable ? (
        <Toolbar
          sx={{
            pl: '0.3rem!important',
            pr: '0.3rem!important',
            pb: '0rem!important',
            minHeight: '40px!important',
            flex: '1'
          }}
        >
          {!nameUnvisible ? (
            <EditableTypography
              typography={
                <Typography
                  sx={{flex: '1 1 100%'}}
                  color="inherit"
                  variant="subtitle1"
                  component="div"
                >
                  {value.name}
                </Typography>
              }
              initialValue={value.name}
              validation={Yup.string()
                .variableNameFirstChar()
                .variableName()
                .noMathFunctionsName()
                .required('required')}
              onSubmit={(name) => {
                value.name = name;
                dispatch(updateAssembly(getRootAssembly(value)));
              }}
              textFieldProps={{
                inputRef: ref,
                name: 'name',
                variant: 'outlined',
                size: 'small',
                sx: {
                  '& legend': {display: 'none'},
                  '& fieldset': {top: 0}
                }
              }}
            />
          ) : null}

          {removable ? (
            <Tooltip title="Delete" sx={{flex: '1'}}>
              <IconButton
                onClick={() => {
                  if (onRemove) onRemove();
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          ) : null}
        </Toolbar>
      ) : null}
      <form onSubmit={formik.handleSubmit}>
        <Box
          component="div"
          sx={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <ValueField
            {...valueFieldProps}
            disabled={disabled}
            onChange={handleChange}
            label="value"
            name="value"
            variant="outlined"
            onFocus={onFocus}
            onBlur={formik.handleBlur}
            value={
              focused || !isNumber(formik.values.value)
                ? formik.values.value
                : toFixedNoZero(formik.values.value, 3)
            }
            error={formik.touched.value && Boolean(formik.errors.value)}
            helperText={formik.touched.value && formik.errors.value}
            unit={unit}
          />
        </Box>
      </form>
    </Box>
  );
}
