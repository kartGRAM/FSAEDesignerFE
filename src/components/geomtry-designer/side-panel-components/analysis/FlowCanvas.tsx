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
    useSelector((state: RootState) => state.uitgd.fullScreenZIndex) +
    10000000000;

  const handleOK = () => {
    setOpen(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const window = document.getElementById('gdAppArea');

  return (
    <Dialog
      container={window}
      onClose={handleOK}
      open={open}
      maxWidth={false}
      aria-labelledby="draggable-dialog-title"
      sx={{
        position: 'absolute',
        zIndex: `${zindex}!important`,
        overflow: 'hidden'
      }}
      PaperProps={{
        sx: {width: 'calc(100% - 10rem)', height: 'calc(100% - 10rem)'}
      }}
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
