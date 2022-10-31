/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {setMovingMode} from '@store/reducers/uiTempGeometryDesigner';
import {setPointOffsetToolDialogInitialPosition} from '@store/reducers/uiGeometryDesigner';
import Paper, {PaperProps} from '@mui/material/Paper';
import Draggable from 'react-draggable';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

export function MoveComponentDialog() {
  const open = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.movingMode
  );

  const zindex =
    useSelector((state: RootState) => state.uitgd.fullScreenZIndex) + 1000;
  const dispatch = useDispatch();

  const handleOK = () => {
    dispatch(setMovingMode(false));
  };

  return (
    <Dialog
      open={open}
      components={{Backdrop: undefined}}
      PaperComponent={PaperCompornent}
      aria-labelledby="draggable-dialog-title"
      sx={{
        zIndex: `${zindex}!important`,
        pointerEvents: 'none'
      }}
    >
      <DialogTitle sx={{marginRight: 10}}>MoveMode</DialogTitle>
      <DialogActions>
        <Button onClick={handleOK}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}

function PaperCompornent(props: PaperProps) {
  const dispatch = useDispatch();
  const {x, y} = useSelector(
    (state: RootState) =>
      state.uigd.present.dialogState.pointOffsetToolDialogInitialPosition
  );
  return (
    <Draggable
      bounds="parent"
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
      defaultPosition={x && y ? {x, y} : undefined}
      onStop={(e, data) => {
        dispatch(
          setPointOffsetToolDialogInitialPosition({
            x: data.lastX,
            y: data.lastY
          })
        );
      }}
    >
      <Paper
        {...props}
        sx={{
          pointerEvents: 'auto'
        }}
      />
    </Draggable>
  );
}
