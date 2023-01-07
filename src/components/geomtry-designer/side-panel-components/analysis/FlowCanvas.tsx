import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {setTestFlowCanvasOpen} from '@store/reducers/uiTempGeometryDesigner';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import PaperComponentDraggable from '@gdComponents/PaperComponentDraggable';

export function FlowCanvas() {
  const open = useSelector(
    (state: RootState) => state.uitgd.isTestFlowCanvasOpen
  );

  const zindex =
    useSelector((state: RootState) => state.uitgd.fullScreenZIndex) + 1000;
  const dispatch = useDispatch();

  const handleOK = () => {
    dispatch(setTestFlowCanvasOpen(false));
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
      <DialogTitle sx={{marginRight: 0}}>
        Move the selected component
      </DialogTitle>
      <DialogActions>
        <Button onClick={handleOK}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}
