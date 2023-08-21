import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {
  setUIDisabled,
  setCopyFromExistingPointsDialogProps,
  setCfepOnSelected
} from '@store/reducers/uiTempGeometryDesigner';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import {Vector3} from 'three';
import PaperComponentDraggable from '@gdComponents/PaperComponentDraggable';

import {setCopyFromExistingPointDialogPosition} from '@store/reducers/uiGeometryDesigner';

export interface CopyFromExistingPointsDialogProps {
  open: boolean;
  onSelected: ((p: Vector3) => void) | null;
}

export function CopyFromExistingPointsDialog() {
  const {open, onSelected} = useSelector(
    (state: RootState) =>
      state.uitgd.gdDialogState.copyFromExistingPointsDialogProps
  );

  const {uitgd} = store.getState();
  const zindex = uitgd.fullScreenZIndex + uitgd.dialogZIndex;
  const dispatch = useDispatch();

  const handleClose = React.useCallback(() => {
    dispatch(
      setCopyFromExistingPointsDialogProps({open: false, onSelected: null})
    );
  }, [dispatch]);

  React.useEffect(() => {
    if (open) {
      dispatch(setUIDisabled(true));
      dispatch(
        setCfepOnSelected((p) => {
          if (onSelected) onSelected(p);
          handleClose();
        })
      );
    } else {
      dispatch(setCfepOnSelected(null));
      dispatch(setUIDisabled(false));
    }
  }, [open, onSelected, dispatch, handleClose]);

  return (
    <Dialog
      open={open}
      components={{Backdrop: undefined}}
      PaperComponent={(props) =>
        PaperComponentDraggable({
          ...props,
          position: (state: RootState) =>
            state.uigd.present.dialogState
              .copyFromExistingPointDialogInitialPosition,
          setPosition: setCopyFromExistingPointDialogPosition
        })
      }
      aria-labelledby="draggable-dialog-title"
      sx={{
        zIndex: `${zindex}!important`,
        pointerEvents: 'none'
      }}
    >
      <DialogTitle>Select an Existing Point</DialogTitle>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
