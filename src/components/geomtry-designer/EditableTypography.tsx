/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import TextField, {TextFieldProps} from '@mui/material/TextField';
import {useFormik} from 'formik';
import * as Yup from 'yup';

const TestName = React.memo(
  (props: {
    typography: JSX.Element;
    initialValue: string;
    validation: Yup.StringSchema;
    onSubmit: (value: string) => void;
    textFieldProps?: TextFieldProps;
  }) => {
    const {typography, initialValue, validation, onSubmit, textFieldProps} =
      props;
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
        e.stopPropagation();
        formik.resetForm();
        setRename(true);
      },
      [formik]
    );

    const onNameEnter = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter') {
          formik.handleSubmit();
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
      <span
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.stopPropagation();
            formik.resetForm();
            setRename(true);
          }
        }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={handleNameDblClick}
      >
        {typography}
      </span>
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
export default TestName;
