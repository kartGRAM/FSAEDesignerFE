import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {
  setPointOffsetToolDialogProps,
  setUIDisabled
} from '@store/reducers/uiTempGeometryDesigner';
import {setPointOffsetToolDialogInitialPosition} from '@store/reducers/uiGeometryDesigner';
import Paper, {PaperProps} from '@mui/material/Paper';
import Draggable from 'react-draggable';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

export interface PointOffsetToolDialogProps {
  zindex: number;
  open: boolean;
}

export function PointOffsetToolDialog() {
  const props = useSelector(
    (state: RootState) => state.uitgd.gdDialogState.pointOffsetToolDialogProps
  );
  const dispatch = useDispatch();
  const open = props?.open ? props.open : false;
  React.useEffect(() => {
    if (open) {
      dispatch(setUIDisabled(true));
    } else {
      dispatch(setUIDisabled(false));
    }
  }, [open]);
  if (!props) return null;
  const {zindex} = props;
  const handleClose = () => {
    dispatch(setPointOffsetToolDialogProps({...props, open: false}));
  };
  return (
    <Dialog
      open={open}
      // onClose={onClose}
      components={{Backdrop: undefined}}
      PaperComponent={PaperCompornent}
      aria-labelledby="draggable-dialog-title"
      sx={{
        zIndex: `${zindex}!important`,
        pointerEvents: 'none'
      }}
    >
      <DialogTitle>Point Offset Tool</DialogTitle>
      <DialogContent />

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
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
