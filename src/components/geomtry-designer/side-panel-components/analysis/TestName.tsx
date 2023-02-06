import React from 'react';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import {useFormik} from 'formik';
import {ITest} from '@gd/analysis/ITest';
import * as Yup from 'yup';

const TestDescription = React.memo(
  (props: {test: ITest; parentUpdate: () => void}) => {
    const {test, parentUpdate} = props;
    const [rename, setRename] = React.useState<boolean>(false);

    const nameFormik = useFormik({
      enableReinitialize: true,
      initialValues: {
        name: test.name
      },
      validationSchema: Yup.object({
        name: Yup.string().required('required')
      }),
      onSubmit: (values) => {
        test.name = values.name;
        test.saveLocalState();
        parentUpdate();
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
        nameFormik.resetForm();
        setRename(true);
      },
      [nameFormik]
    );

    const onNameEnter = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter') {
          nameFormik.handleSubmit();
        }
      },
      [nameFormik]
    );

    const onNameBlur = React.useCallback(
      (
        e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>
      ) => {
        setRename(false);
        nameFormik.handleBlur(e);
      },
      [nameFormik]
    );

    return !rename ? (
      <DialogTitle
        onDoubleClick={handleNameDblClick}
        onClick={(e) => e.stopPropagation()}
        color="inherit"
        variant="subtitle1"
        sx={{pb: 0}}
      >
        {test.name}
      </DialogTitle>
    ) : (
      <TextField
        inputRef={ref}
        onChange={nameFormik.handleChange}
        // label="name"
        name="name"
        variant="outlined"
        size="small"
        onKeyDown={onNameEnter}
        value={nameFormik.values.name}
        onBlur={onNameBlur}
        error={nameFormik.touched.name && Boolean(nameFormik.errors.name)}
        helperText={nameFormik.touched.name && nameFormik.errors.name}
        sx={{
          pt: 1,
          pl: 1,
          pr: 1,
          '& legend': {display: 'none'},
          '& fieldset': {top: 0}
        }}
        InputProps={{
          sx: {color: '#000'}
        }}
      />
    );
  }
);
export default TestDescription;
