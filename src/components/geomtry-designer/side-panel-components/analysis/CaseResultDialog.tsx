import * as React from 'react';
import {Dialog, DialogContent, DialogTitle} from '@mui/material';
import {useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {setUIDisabled} from '@store/reducers/uiTempGeometryDesigner';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import PaperComponentDraggable from '@gdComponents/PaperComponentDraggable';
import {setCaseResultDialogPosition} from '@store/reducers/uiGeometryDesigner';

export const CaseResultDialog = React.memo(
  (props: {open: boolean; exitReplayMode: () => void}) => {
    const {open, exitReplayMode} = props;
    const {uitgd} = store.getState();
    const zindex = uitgd.fullScreenZIndex + uitgd.dialogZIndex + 1;
    const dispatch = useDispatch();

    const handleOK = () => {
      exitReplayMode();
    };

    React.useEffect(() => {
      if (open) {
        dispatch(setUIDisabled(true));
      } else {
        dispatch(setUIDisabled(false));
      }
    }, [open, dispatch]);

    return (
      <Dialog
        open={open}
        components={{Backdrop: undefined}}
        PaperComponent={(props) =>
          PaperComponentDraggable({
            ...props,
            position: (state: RootState) =>
              state.uigd.present.dialogState
                .caseResultDialogInitialPosition ?? {x: null, y: null},
            setPosition: setCaseResultDialogPosition
          })
        }
        aria-labelledby="draggable-dialog-title"
        sx={{
          zIndex: `${zindex}!important`,
          pointerEvents: 'none'
        }}
      >
        <DialogTitle>Replay Mode</DialogTitle>
        <DialogContent>aaaaaaaa</DialogContent>
        <DialogActions>
          <Button onClick={handleOK}>Back</Button>
        </DialogActions>
      </Dialog>
    );
  }
);
