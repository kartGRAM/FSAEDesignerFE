import React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import {ITest} from '@gd/analysis/ITest';
import * as Yup from 'yup';
import EditableTypography from '@gdComponents/EditableTypography';

const TestDescription = React.memo(
  (props: {test: ITest; parentUpdate: () => void}) => {
    const {test, parentUpdate} = props;

    return (
      <EditableTypography
        typography={
          <DialogTitle color="inherit" variant="subtitle1" sx={{pb: 0}}>
            {test.name}
          </DialogTitle>
        }
        initialValue={test.name}
        validation={Yup.string().required('required')}
        onSubmit={(value) => {
          test.name = value;
          test.saveLocalState();
          parentUpdate();
        }}
        textFieldProps={{
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
        }}
      />
    );
  }
);
export default TestDescription;
