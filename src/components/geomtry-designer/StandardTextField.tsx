import * as React from 'react';
import TextField, {StandardTextFieldProps} from '@mui/material/TextField';
import {setControlDisabled} from '@store/reducers/uiTempGeometryDesigner';
import {useDispatch} from 'react-redux';

export const StandardTextField = React.memo((props: StandardTextFieldProps) => {
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

  return (
    <TextField
      variant="standard"
      {...props}
      onFocus={onFocusWrapper}
      onBlur={onBlurWrapper}
    />
  );
});

export default StandardTextField;
