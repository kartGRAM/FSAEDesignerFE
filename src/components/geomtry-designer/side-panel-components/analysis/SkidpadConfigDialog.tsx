import React from 'react';
import {Dialog, DialogContent, Button, DialogActions} from '@mui/material';
import {setConfirmDialogProps} from '@store/reducers/uiTempGeometryDesigner';
import {PaperProps} from '@mui/material/Paper';
import {useDispatch} from 'react-redux';
import store from '@store/store';
import {ITest} from '@gd/analysis/ITest';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as Yup from 'yup';

export const SkidpadConfigDialog = React.memo(
  (props: {
    test: ITest;
    open: boolean;
    onClose: () => void;
    onApply?: () => void;
    onCancel?: () => void;
    paperProps?: PaperProps;
  }) => {
    const {open, test, onClose, onApply, onCancel, paperProps} = props;

    const [stateAtOpen, setStateAtOpen] = React.useState<string>('');
    if (open) test.undoBlockPoint = stateAtOpen;
    const dispatch = useDispatch();

    React.useEffect(() => {
      if (open) {
        setStateAtOpen(test.getLocalStateID());
      } else {
        test.undoBlockPoint = '';
      }
    }, [open, test]);

    const {uitgd} = store.getState();
    const zindex = uitgd.fullScreenZIndex + uitgd.dialogZIndex * 2;

    const changed = stateAtOpen !== test.getLocalStateID();

    const handleApply = React.useCallback(() => {
      test.saveLocalState();
      // test.asLastestState();
      const lastestID = test.getLocalStateID();
      test.squashLocalStates(stateAtOpen, lastestID);
      setStateAtOpen(lastestID);
      if (onApply) onApply();
    }, [onApply, test, stateAtOpen]);

    const handleOK = React.useCallback(() => {
      handleApply();
      onClose();
    }, [handleApply, onClose]);

    const handleCancel = React.useCallback(async () => {
      if (changed) {
        const ret = await new Promise<string>((resolve) => {
          dispatch(
            setConfirmDialogProps({
              zindex: zindex + 10000 + 1,
              onClose: resolve,
              title: 'Warning',
              message: `All changes will not be saved. Are you okay?`,
              buttons: [
                {text: 'OK', res: 'ok'},
                {text: 'Cancel', res: 'cancel', autoFocus: true}
              ]
            })
          );
        });
        dispatch(setConfirmDialogProps(undefined));
        if (ret !== 'ok') {
          return;
        }
      }
      if (onCancel) {
        onCancel();
      }
      test.loadLocalState(stateAtOpen);
      test.asLastestState();
      onClose();
    }, [changed, onCancel, test, stateAtOpen, onClose, dispatch, zindex]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const window = document.getElementById('gdAppArea');
    return (
      <Dialog
        onClick={(e) => e.stopPropagation()}
        open={open}
        container={window}
        maxWidth={false}
        TransitionProps={{unmountOnExit: true}}
        onClose={handleCancel}
        sx={{
          position: 'absolute',
          zIndex: `${zindex}!important`,
          overflow: 'hidden'
        }}
        PaperProps={paperProps || {sx: {minWidth: '60%', height: '60%'}}}
      >
        <DialogContent
          sx={{
            '&::-webkit-scrollbar': {
              display: 'none'
            }
          }}
        >
          aaa
        </DialogContent>

        <DialogActions>
          <Button onClick={handleApply} disabled={!changed}>
            Apply
          </Button>
          <Button onClick={handleOK} disabled={!changed}>
            OK
          </Button>
          <Button onClick={handleCancel}>Cancel</Button>
        </DialogActions>
      </Dialog>
    );
  }
);
export default SkidpadConfigDialog;
