import React from 'react';
import Typography from '@mui/material/Typography';
import {useDispatch} from 'react-redux';
import {updateAssembly} from '@store/reducers/dataGeometryDesigner';
import * as Yup from 'yup';
import {
  IElement,
  isBodyOfFrame,
  isMirror,
  getRootAssembly
} from '@gd/IElements';
import EditableTypography from '@gdComponents/EditableTypography';

export interface Props {
  element: IElement;
}

const ElementName = React.memo((props: Props) => {
  const {element} = props;

  const dispatch = useDispatch();

  return (
    <EditableTypography
      disabled={isBodyOfFrame(element) || isMirror(element)}
      typography={
        <Typography variant="h6" component="div">
          {element.name.value} Parameters {isMirror(element) ? '(Mirror)' : ''}
        </Typography>
      }
      initialValue={element.name.value}
      validation={Yup.string()
        .variableNameFirstChar()
        .variableName()
        .noMathFunctionsName()
        .required('required')}
      onSubmit={(name) => {
        element.name.value = name;
        dispatch(updateAssembly(getRootAssembly(element)));
      }}
      textFieldProps={{
        sx: {
          '& legend': {display: 'none'},
          '& fieldset': {top: 0}
        },
        InputProps: {
          sx: {color: '#FFFFFF'}
        }
      }}
    />
  );
});

export default ElementName;
