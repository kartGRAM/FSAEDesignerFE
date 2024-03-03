import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {
  setUIDisabled,
  setMovePointDialogProps,
  setMovePointOnMoved
} from '@store/reducers/uiTempGeometryDesigner';
import {INamedVector3} from '@gd/INamedValues';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import {Vector3} from 'three';
import PaperComponentDraggable from '@gdComponents/PaperComponentDraggable';
import {setMovePointDialogPosition} from '@store/reducers/uiGeometryDesigner';

export interface MovePointDialogProps {
  open: boolean;
  target: INamedVector3 | null;
  onMoved: ((delta: Vector3) => void) | null;
}

export function MovePointDialog() {
  const {open, onMoved} = useSelector(
    (state: RootState) => state.uitgd.gdDialogState.movePointDialogProps
  );

  const {uitgd} = store.getState();
  const zindex = uitgd.fullScreenZIndex + uitgd.dialogZIndex;
  const dispatch = useDispatch();

  const deltaRef = React.useRef(new Vector3());
  const handleOK = () => {
    if (onMoved) onMoved(deltaRef.current);
    handleClose();
  };
  const handleClose = () => {
    dispatch(
      setMovePointDialogProps({open: false, target: null, onMoved: null})
    );
  };

  React.useEffect(() => {
    if (open) {
      dispatch(setUIDisabled(true));

      deltaRef.current.set(0, 0, 0);
      dispatch(
        setMovePointOnMoved((delta) => {
          deltaRef.current.copy(delta);
        })
      );
    } else {
      dispatch(setUIDisabled(false));
    }
  }, [open, onMoved, dispatch]);

  return (
    <Dialog
      open={open}
      components={{Backdrop: undefined}}
      PaperComponent={(props) =>
        PaperComponentDraggable({
          ...props,
          position: (state: RootState) =>
            state.uigd.dialogState.movePointDialogInitialPosition,
          setPosition: setMovePointDialogPosition
        })
      }
      aria-labelledby="draggable-dialog-title"
      sx={{
        zIndex: `${zindex}!important`,
        pointerEvents: 'none'
      }}
    >
      <DialogTitle>Move</DialogTitle>
      <DialogActions>
        <Button onClick={handleOK}>OK</Button>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
