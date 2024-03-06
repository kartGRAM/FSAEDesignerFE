import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {updateAssembly} from '@store/reducers/dataGeometryDesigner';
import {
  getElementByPath,
  isBodyOfFrame,
  isMirror,
  getRootAssembly
} from '@gd/IElements';

import Button from '@mui/material/Button';
import StandardTextField from '@gdComponents/StandardTextField';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import {useFormik} from 'formik';
import * as Yup from 'yup';

export interface RenameDialogProps {
  absPath: string;
  onClose: (value: string) => void;
}

export function RenameDialog(props: RenameDialogProps) {
  const {absPath, onClose} = props;

  const {uitgd} = store.getState();
  const zindex = uitgd.fullScreenZIndex + uitgd.dialogZIndex;
  const assembly = useSelector((state: RootState) => state.uitgd.assembly);
  const element = getElementByPath(assembly, absPath);
  const dispatch = useDispatch();

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: element?.name.value ?? 'name'
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .variableNameFirstChar()
        .variableName()
        .noMathFunctionsName()
        .required('required')
    }),
    onSubmit: (values) => {
      if (element) {
        element.name.value = values.name;
        dispatch(updateAssembly(getRootAssembly(element)));
      }
      onClose('ok');
    }
  });

  if (!element || isMirror(element) || isBodyOfFrame(element)) {
    onClose('cancel');
    return null;
  }

  const handleClose = (ret: string) => {
    onClose(ret);
  };

  const handleSave = () => {
    formik.handleSubmit();
  };

  return (
    <Dialog
      sx={{
        zIndex: `${zindex}!important`,
        backdropFilter: 'blur(3px)'
      }}
      onClose={() => handleClose('cancel')}
      open
    >
      <DialogTitle>Rename</DialogTitle>
      <DialogContent>
        <StandardTextField
          autoFocus
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          label="name"
          name="name"
          value={formik.values.name}
          error={formik.touched.name && Boolean(formik.errors.name)}
          helperText={formik.touched.name && formik.errors.name}
          margin="dense"
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} disabled={!formik.isValid} autoFocus>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
