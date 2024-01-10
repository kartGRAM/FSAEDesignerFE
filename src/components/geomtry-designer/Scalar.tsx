/* eslint-disable no-nested-ternary */
import React, {useState} from 'react';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
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
import {ValueField} from './ValueField';

export interface Props {
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
}

export default function Scalar(props: Props) {
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

  const [rename, setRename] = React.useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);

  const nameFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: value.name
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .variableNameFirstChar()
        .variableName()
        .noMathFunctionsName()
        .required('required')
    }),
    onSubmit: (values) => {
      value.name = values.name;
      dispatch(updateAssembly(value));
      setRename(false);
    }
  });

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
      if (value.parent) dispatch(updateAssembly(value));
      if (onUpdate) onUpdate();
    }
  });

  // eslint-disable-next-line consistent-return
  React.useEffect(() => {
    if (onFocusChanged) return onFocusChanged(focused);
  }, [focused, onFocusChanged, value]);

  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (rename) {
      ref.current?.focus();
    }
  }, [rename]);

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

  const handleNameDblClick = () => {
    nameFormik.resetForm();
    setRename(true);
  };

  const onNameEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      nameFormik.handleSubmit();
    }
  };

  const onNameBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>
  ) => {
    setRename(false);
    nameFormik.handleBlur(e);
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
            !rename ? (
              <Typography
                sx={{flex: '1 1 100%'}}
                color="inherit"
                variant="subtitle1"
                component="div"
                onDoubleClick={handleNameDblClick}
              >
                {value.name}
              </Typography>
            ) : (
              <TextField
                inputRef={ref}
                onChange={nameFormik.handleChange}
                name="name"
                variant="outlined"
                size="small"
                onKeyDown={onNameEnter}
                value={nameFormik.values.name}
                onBlur={onNameBlur}
                error={
                  nameFormik.touched.name && Boolean(nameFormik.errors.name)
                }
                helperText={nameFormik.touched.name && nameFormik.errors.name}
                sx={{
                  '& legend': {display: 'none'},
                  '& fieldset': {top: 0}
                }}
              />
            )
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
            value={formik.values.value}
            error={formik.touched.value && Boolean(formik.errors.value)}
            helperText={formik.touched.value && formik.errors.value}
            onBlur={formik.handleBlur}
            unit={unit}
          />
        </Box>
      </form>
    </Box>
  );
}
