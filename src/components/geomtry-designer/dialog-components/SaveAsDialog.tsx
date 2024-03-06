import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {setSaveAsDialogProps} from '@store/reducers/uiTempGeometryDesigner';
import Button from '@mui/material/Button';
import StandardTextField from '@gdComponents/StandardTextField';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import {useFormik} from 'formik';
import saveAs from '@gd/SaveAs';
import * as Yup from 'yup';
import useAxios from 'axios-hooks';

export type SaveAsDialogProps = {
  onClose: (value: string) => void;
};

export function SaveAsDialog(props: SaveAsDialogProps) {
  const {onClose} = props;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [{data, loading, error}, updateData] = useAxios(
    {
      url: '/api/gd/save_as/',
      method: 'POST'
    },
    {
      manual: true
    }
  );

  const {uitgd} = store.getState();
  const zindex = uitgd.fullScreenZIndex + uitgd.dialogZIndex;
  const filename = useSelector(
    (state: RootState) => state.dgd.present.filename
  );
  const note = useSelector((state: RootState) => state.dgd.present.note);
  const dispatch = useDispatch();
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      filename,
      note
    },
    validationSchema: Yup.object({
      filename: Yup.string()
        .min(3, 'At least 3 letters required.')
        .max(64, '64 letters max.')
        .required(),
      note: Yup.string()
        .max(1024 * 4)
        .notRequired()
    }),
    onSubmit: (values) => {
      saveAs({
        dispatch,
        filename: values.filename,
        note: values.note,
        overwrite: false,
        updateDataFuncAxiosHooks: updateData,
        zindex,
        next: () => {
          handleClose('saved');
        }
      });
    }
  });

  const handleClose = (ret: string) => {
    dispatch(setSaveAsDialogProps(undefined));
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
      <DialogTitle>Save As...</DialogTitle>
      <DialogContent>
        <StandardTextField
          autoFocus
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          label="filename"
          name="filename"
          value={formik.values.filename}
          error={formik.touched.filename && Boolean(formik.errors.filename)}
          helperText={formik.touched.filename && formik.errors.filename}
          margin="dense"
          fullWidth
        />
        <DialogContentText sx={{pt: 3}}>
          If you wish to annotate a file, please complete the note below.
        </DialogContentText>
        <StandardTextField
          autoFocus
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          label="note"
          name="note"
          value={formik.values.note}
          error={formik.touched.note && Boolean(formik.errors.note)}
          helperText={formik.touched.note && formik.errors.note}
          margin="dense"
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} disabled={!formik.isValid}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
