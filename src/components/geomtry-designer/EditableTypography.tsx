import React from 'react';
import TextField, {TextFieldProps} from '@mui/material/TextField';
import Box, {BoxProps} from '@mui/material/Box';
import {useFormik} from 'formik';
import * as Yup from 'yup';

const EditableTypography = React.memo(
  (props: {
    typography: JSX.Element | string;
    initialValue: string;
    validation: Yup.StringSchema;
    onSubmit: (value: string) => void;
    textFieldProps?: TextFieldProps;
    boxProps?: BoxProps;
    disabled?: boolean;
    disableDblClickToEditMode?: boolean;
  }) => {
    const {
      typography,
      initialValue,
      validation,
      onSubmit,
      disabled,
      disableDblClickToEditMode
    } = props;
    const boxProps = props.boxProps ?? {};

    const textFieldProps = props.textFieldProps ?? {
      sx: {
        pt: 1,
        pl: 1,
        pr: 1,
        '& legend': {display: 'none'},
        '& fieldset': {top: 0}
      },
      InputProps: {
        sx: {color: '#000'}
      }
    };
    const [rename, setRename] = React.useState<boolean>(false);

    const formik = useFormik({
      enableReinitialize: true,
      initialValues: {
        value: initialValue
      },
      validationSchema: Yup.object({
        value: validation
      }),
      onSubmit: (values) => {
        onSubmit(values.value);
        setRename(false);
      }
    });

    const ref = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      if (rename) {
        ref.current?.focus();
      }
    }, [rename]);

    const handleNameDblClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (disableDblClickToEditMode) return;
        e.stopPropagation();
        if (!disabled) {
          formik.resetForm();
          setRename(true);
        }
      },
      [disableDblClickToEditMode, disabled, formik]
    );

    const onNameEnter = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter') {
          formik.handleSubmit();
          e.stopPropagation();
          e.preventDefault();
        } else if (e.key === 'Escape') {
          setRename(false);
          e.stopPropagation();
          e.preventDefault();
        }
      },
      [formik]
    );

    const handleNameKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === 'F2') {
          e.stopPropagation();
          formik.resetForm();
          setRename(true);
        }
      },
      [formik]
    );

    const onNameBlur = React.useCallback(
      (
        e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>
      ) => {
        setRename(false);
        formik.handleSubmit();
        formik.handleBlur(e);
      },
      [formik]
    );

    return !rename ? (
      <Box {...boxProps} component="div">
        <span
          role="button"
          tabIndex={0}
          onKeyDown={handleNameKeyDown}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={handleNameDblClick}
        >
          {typography}
        </span>
      </Box>
    ) : (
      <TextField
        {...textFieldProps}
        inputRef={ref}
        onChange={(e) => {
          formik.handleChange(e);
        }}
        name="value"
        variant="outlined"
        size="small"
        onKeyDown={onNameEnter}
        value={formik.values.value}
        onBlur={onNameBlur}
        error={formik.touched.value && Boolean(formik.errors.value)}
        helperText={formik.touched.value && formik.errors.value}
      />
    );
  }
);
export default EditableTypography;
