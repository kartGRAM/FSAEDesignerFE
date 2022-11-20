import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {setUIDisabled} from '@store/reducers/uiTempGeometryDesigner';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import FullLayoutKeyboard from './FullLayoutKeyboad';
import 'react-simple-keyboard/build/css/index.css';

export interface PointOffsetToolDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function KeyBindingsDialog(props: PointOffsetToolDialogProps) {
  const {open, setOpen} = props;

  const zindex =
    useSelector((state: RootState) => state.uitgd.fullScreenZIndex) + 1000;
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (open) {
      dispatch(setUIDisabled(true));
    } else {
      dispatch(setUIDisabled(false));
    }
  }, [open]);

  const handleApply = () => {};

  const handleClose = () => {
    setOpen(false);
  };

  const handleOKClick = () => {
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      // onClose={onClose}
      sx={{
        zIndex: `${zindex}!important`
      }}
      PaperProps={{sx: {maxWidth: 'unset', width: '960px'}}}
    >
      <DialogTitle>Key Bindings Dialog</DialogTitle>
      <DialogContent>
        <FullLayoutKeyboard />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleApply}>Apply</Button>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleOKClick}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}
