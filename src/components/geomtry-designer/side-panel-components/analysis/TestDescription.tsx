import React from 'react';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import {useFormik} from 'formik';
import {ITest} from '@gd/analysis/ITest';
import * as Yup from 'yup';

const TestName = React.memo(
  (props: {test: ITest; parentUpdate: () => void}) => {
    const {test, parentUpdate} = props;
    const [rename, setRename] = React.useState<boolean>(false);

    const nameFormik = useFormik({
      enableReinitialize: true,
      initialValues: {
        name: test.description
      },
      validationSchema: Yup.object({
        name: Yup.string().required('required')
      }),
      onSubmit: (values) => {
        test.description = values.name;
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
        sx={{pt: 0, lineHeight: 0.2}}
        onDoubleClick={handleNameDblClick}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="caption">{test.description}</Typography>
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
export default TestName;
