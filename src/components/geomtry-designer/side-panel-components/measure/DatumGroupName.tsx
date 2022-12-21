import React from 'react';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {useSelector} from 'react-redux';
import {useFormik} from 'formik';
import {IDatumGroup} from '@gd/measure/IDatumObjects';
import {RootState} from '@store/store';
import * as Yup from 'yup';

export const DatumGroupName = React.memo((props: {group: IDatumGroup}) => {
  const {group} = props;
  const datumManager = useSelector(
    (state: RootState) => state.uitgd.datumManager
  );

  const [rename, setRename] = React.useState<boolean>(false);

  const nameFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: group.name
    },
    validationSchema: Yup.object({
      name: Yup.string().variableNameFirstChar().required('required')
    }),
    onSubmit: (values) => {
      group.name = values.name;
      datumManager?.dispatch();
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
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>) => {
      setRename(false);
      nameFormik.handleBlur(e);
    },
    [nameFormik]
  );

  return !rename ? (
    <>
      <Typography
        onDoubleClick={handleNameDblClick}
        onClick={(e) => e.stopPropagation()}
        color="inherit"
        variant="subtitle1"
        sx={{whiteSpace: 'nowrap', pt: 0.7, pl: 1}}
      >
        {group.name}
      </Typography>
      <Typography
        sx={{
          flex: '1 1 100%'
        }}
      >
        {' '}
      </Typography>
    </>
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
        flex: '1 1 100%',
        '& legend': {display: 'none'},
        '& fieldset': {top: 0}
      }}
      InputProps={{
        sx: {color: '#000'}
      }}
    />
  );
});
