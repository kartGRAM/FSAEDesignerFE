import React, {useState} from 'react';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import {INamedNumber} from '@gd/IDataValues';
import Typography from '@mui/material/Typography';
import {useDispatch} from 'react-redux';
import {updateAssembly} from '@store/reducers/dataGeometryDesigner';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import Toolbar from '@mui/material/Toolbar';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

export interface Props {
  value: INamedNumber;
  unit: string;
  removable?: boolean;
  onRemove?: () => void;
}

export default function Scalar(props: Props) {
  const {value, unit, removable, onRemove} = props;
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
      dispatch(updateAssembly({element: value.parent}));
      setRename(false);
    }
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      value: sValue
    },
    validationSchema: Yup.object({
      value: Yup.string().gdFormulaIsValid().required('required')
    }),
    onSubmit: (values) => {
      value.setValue(values.value);
      dispatch(updateAssembly({element: value.parent}));
    }
  });

  React.useEffect(() => {
    /*
    if (focused)
      dispatch(setSelectedPoint({point: getDataVector3(trans(vector))}));
    return () => {
      if (!focused) dispatch(setSelectedPoint({point: null}));
    };
    */
  }, [focused, value]);

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
    <Box sx={{padding: 1}} onFocus={handleFocus} onBlur={handleBlur}>
      <Toolbar
        sx={{
          pl: '0.3rem!important',
          pr: '0.3rem!important',
          pb: '0rem!important',
          minHeight: '40px!important',
          flex: '1'
        }}
      >
        {!rename ? (
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
          />
        )}

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
      <form onSubmit={formik.handleSubmit}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <ValueField
            onChange={handleChange}
            label="value"
            name="x"
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

interface ValueFieldProps extends OutlinedTextFieldProps {
  unit: string;
}

const ValueField = (props: ValueFieldProps) => {
  const {unit} = props;
  return (
    <TextField
      size="small"
      // margin="none"
      {...props}
      InputProps={{
        endAdornment: <InputAdornment position="end">{unit}</InputAdornment>
      }}
      sx={{
        margin: 1
        // width: '15ch'
      }}
    />
  );
};
