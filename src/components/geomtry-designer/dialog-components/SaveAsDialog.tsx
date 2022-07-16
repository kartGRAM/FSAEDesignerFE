import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {
  setSaveAsDialogProps,
  setConfirmDialogProps
} from '@store/reducers/uiTempGeometryDesigner';
import {
  setTopAssembly,
  getSetTopAssemblyParams
} from '@store/reducers/dataGeometryDesigner';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import useAxios from 'axios-hooks';
import axios from 'axios';
import {getDataToSave} from '@app/utils/axios';

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

  const zindex = useSelector(
    (state: RootState) => state.uitgd.fullScreenZIndex + 10000
  );
  const filename = useSelector((state: RootState) => state.dgd.filename);
  const note = useSelector((state: RootState) => state.dgd.note);
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
      async function save(overwrite: boolean) {
        try {
          const res: any = await updateData({
            data: getDataToSave(values.filename, values.note, overwrite),
            headers: {
              'content-type': 'multipart/form-data'
            }
          });
          dispatch(setTopAssembly(getSetTopAssemblyParams(res.data)));
          handleClose('saved');
        } catch (err) {
          if (
            axios.isAxiosError(err) &&
            err.response &&
            err.response.status === 409
          ) {
            const errorMessage: any = err.response.data;
            if (errorMessage.error === 'File already exists.') {
              const ret = await new Promise<string>((resolve) => {
                dispatch(
                  setConfirmDialogProps({
                    zindex: zindex + 1,
                    onClose: resolve,
                    title: `${filename} is already exists.`,
                    message: 'Overwite?',
                    buttons: [
                      {text: 'Overwrite', res: 'ok'},
                      {text: 'Cancel', res: 'cancel', autoFocus: true}
                    ]
                  })
                );
              });
              dispatch(setConfirmDialogProps(undefined));
              if (ret === 'ok') {
                save(true);
              }
            }
          }
        }
      }
      save(false);
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
        <TextField
          autoFocus
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
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
          onBlur={formik.handleBlur}
          label="note"
          name="note"
          variant="standard"
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
