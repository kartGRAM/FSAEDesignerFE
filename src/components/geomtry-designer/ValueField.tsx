import * as React from 'react';
import TextField, {OutlinedTextFieldProps} from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import {setControlDisabled} from '@store/reducers/uiTempGeometryDesigner';
import {useDispatch} from 'react-redux';

export interface ValueFieldProps extends OutlinedTextFieldProps {
  unit: string;
}

export const ValueField = (props: ValueFieldProps) => {
  const dispatch = useDispatch();
  const {onFocus, onBlur} = props;
  const onFocusWrapper = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>) => {
      dispatch(setControlDisabled(true));
      if (onFocus) onFocus(e);
    },
    [dispatch, onFocus]
  );
  const onBlurWrapper = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>) => {
      dispatch(setControlDisabled(true));
      if (onBlur) onBlur(e);
    },
    [dispatch, onBlur]
  );

  const {unit, sx} = props;
  return (
    <TextField
      size="small"
      // margin="none"
      {...props}
      onFocus={onFocusWrapper}
      onBlur={onBlurWrapper}
      InputProps={{
        endAdornment: <InputAdornment position="end">{unit}</InputAdornment>
      }}
      sx={{
        ...sx,
        margin: 1
        // width: '15ch'
      }}
    />
  );
};
