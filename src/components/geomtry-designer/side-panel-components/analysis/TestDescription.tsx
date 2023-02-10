import React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import {ITest} from '@gd/analysis/ITest';
import EditableTypography from '@gdComponents/EditableTypography';
import * as Yup from 'yup';

export const TestDiscription = React.memo(
  (props: {test: ITest; parentUpdate: () => void}) => {
    const {test, parentUpdate} = props;

    return (
      <EditableTypography
        typography={
          <DialogTitle sx={{pt: 0, lineHeight: 0.2}}>
            <Typography variant="caption">{test.description}</Typography>
          </DialogTitle>
        }
        initialValue={test.description}
        validation={Yup.string().required('required')}
        onSubmit={(value) => {
          test.description = value;
          test.saveLocalState();
          parentUpdate();
        }}
        textFieldProps={{
          sx: {
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
export default TestDiscription;
