import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {setMovingMode} from '@store/reducers/uiTempGeometryDesigner';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import PaperComponentDraggable from '@gdComponents/PaperComponentDraggable';
import {setMoveDialogPosition} from '@store/reducers/uiGeometryDesigner';

export function MoveComponentDialog() {
  const open = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.movingMode
  );

  const zindex = useSelector(
    (state: RootState) =>
      state.uitgd.fullScreenZIndex + state.uitgd.dialogZIndex
  );
  const dispatch = useDispatch();

  const handleOK = () => {
    dispatch(setMovingMode(false));
  };

  return (
    <Dialog
      open={open}
      components={{Backdrop: undefined}}
      PaperComponent={(props) =>
        PaperComponentDraggable({
          ...props,
          position: (state: RootState) =>
            state.uigd.present.dialogState.moveDialogInitialPosition,
          setPosition: setMoveDialogPosition
        })
      }
      aria-labelledby="draggable-dialog-title"
      sx={{
        zIndex: `${zindex}!important`,
        pointerEvents: 'none'
      }}
    >
      <DialogTitle sx={{marginRight: 0}}>
        Move the selected component
      </DialogTitle>
      <DialogActions>
        <Button onClick={handleOK}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}
