import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import {DialogContent} from '@mui/material';

export function FlowCanvas(props: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const {open, setOpen} = props;
  const zindex =
    useSelector((state: RootState) => state.uitgd.fullScreenZIndex) + 1000;

  const handleOK = () => {
    setOpen(false);
  };

  return (
    <Dialog
      onClose={handleOK}
      open={open}
      aria-labelledby="draggable-dialog-title"
      sx={{
        zIndex: `${zindex}!important`
      }}
      PaperProps={{sx: {width: '100%', maxWidth: 'unset', height: '100%'}}}
    >
      <DialogTitle sx={{marginRight: 0}}>
        Move the selected component
      </DialogTitle>
      <DialogContent />
      <DialogActions>
        <Button onClick={handleOK}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
