import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog, {DialogProps} from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {setSaveAsDialogOpen} from '@store/reducers/uiTempGeometryDesigner';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import {useFormik} from 'formik';
import * as Yup from 'yup';

export function SaveAsDialog(props: DialogProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formulaDialogOpen: boolean = useSelector(
    (state: RootState) => state.uitgd.gdDialogState.saveAsDialogOpen
  );
  const filename = useSelector((state: RootState) => state.dgd.filename);
  const dispatch = useDispatch();
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      filename,
      note: ''
    },
    validationSchema: Yup.object({
      filename: Yup.string().min(3).max(256).required(),
      note: Yup.string()
        .max(1024 * 4)
        .notRequired()
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSubmit: (values) => {}
  });

  const handleClose = () => {
    dispatch(setSaveAsDialogOpen({open: false}));
  };

  const handleSave = () => {
    dispatch(setSaveAsDialogOpen({open: false}));
  };

  return (
    <Dialog {...props} onClose={handleClose} open={formulaDialogOpen}>
      <DialogTitle>Save As...</DialogTitle>
      <DialogContent>
        <form onSubmit={formik.handleSubmit}>
          <TextField
            autoFocus
            onChange={formik.handleChange}
            label="filename"
            name="filename"
            variant="standard"
            value={formik.values.filename}
            error={formik.touched.filename && Boolean(formik.errors.filename)}
            helperText={formik.touched.filename && formik.errors.filename}
            margin="dense"
            fullWidth
          />
          <DialogContentText sx={{pt: 3}}>
            If you wish to annotate a file, please complete the note below.
          </DialogContentText>
          <TextField
            autoFocus
            onChange={formik.handleChange}
            label="note"
            name="note"
            variant="standard"
            value={formik.values.note}
            error={formik.touched.note && Boolean(formik.errors.note)}
            helperText={formik.touched.note && formik.errors.note}
            margin="dense"
            fullWidth
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
