import React from 'react';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {useDispatch} from 'react-redux';
import {updateAssembly} from '@store/reducers/dataGeometryDesigner';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import {
  IElement,
  isBodyOfFrame,
  isMirror,
  getRootAssembly
} from '@gd/IElements';

export interface Props {
  element: IElement;
}

const ElementName = React.memo((props: Props) => {
  const {element} = props;

  const dispatch = useDispatch();
  const [rename, setRename] = React.useState<boolean>(false);

  const nameFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: element.name.value
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .variableNameFirstChar()
        .variableName()
        .noMathFunctionsName()
        .required('required')
    }),
    onSubmit: (values) => {
      element.name.value = values.name;
      dispatch(updateAssembly(getRootAssembly(element)));
      setRename(false);
    }
  });

  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (rename) {
      ref.current?.focus();
    }
  }, [rename]);

  const handleNameDblClick = React.useCallback(() => {
    nameFormik.resetForm();
    setRename(true);
  }, [nameFormik]);

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

  return !rename || isBodyOfFrame(element) || isMirror(element) ? (
    <Typography variant="h6" component="div" onDoubleClick={handleNameDblClick}>
      {element.name.value} Parameters {isMirror(element) ? '(Mirror)' : ''}
    </Typography>
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
        '& legend': {display: 'none'},
        '& fieldset': {top: 0}
      }}
      InputProps={{
        sx: {color: '#FFFFFF'}
      }}
    />
  );
});

export default ElementName;
