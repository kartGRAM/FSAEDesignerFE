/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import PaperComponentDraggable from '@gdComponents/PaperComponentDraggable';
import {IDatumObject} from '@gd/measure/IDatumObjects';

export function DatumDialog(props: {
  open: boolean;
  close: () => void;
  datum?: IDatumObject;
}) {
  const {open, close, datum} = props;
  const zindex =
    useSelector((state: RootState) => state.uitgd.fullScreenZIndex) + 1000;

  const handleOK = () => {
    close();
  };
  const handleCancel = () => {
    close();
  };
  const handleApply = () => {
    close();
  };

  return (
    <Dialog
      open={open}
      components={{Backdrop: undefined}}
      PaperComponent={PaperComponentDraggable}
      aria-labelledby="draggable-dialog-title"
      sx={{
        zIndex: `${zindex}!important`,
        pointerEvents: 'none'
      }}
    >
      <DialogTitle sx={{marginRight: 10}}>MoveMode</DialogTitle>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleApply}>Appy</Button>
        <Button onClick={handleOK}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}
