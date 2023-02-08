import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  DialogActions
} from '@mui/material';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';

export default function FlowNodeDialog(props: {
  children: JSX.Element | JSX.Element[];
  title: string;
  open: boolean;
  onClose: (event: any, reason: string) => void;
}) {
  const {children, title, open, onClose} = props;
  const zindex =
    useSelector((state: RootState) => state.uitgd.fullScreenZIndex) +
    10000000001;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const window = document.getElementById('gdAppArea');
  return (
    <Dialog
      open={open}
      TransitionProps={{unmountOnExit: true}}
      container={window}
      maxWidth={false}
      onClose={onClose}
      sx={{
        position: 'absolute',
        zIndex: `${zindex}!important`,
        overflow: 'hidden'
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>

      <DialogActions>
        <Button onClick={handleApply} disabled={!test.changed}>
          Apply
        </Button>
        <Button onClick={handleOK} disabled={!test.changed}>
          OK
        </Button>
        <Button onClick={handleCancel}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
