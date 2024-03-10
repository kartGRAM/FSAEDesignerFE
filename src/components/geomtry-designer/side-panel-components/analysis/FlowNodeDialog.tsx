import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  DialogActions
} from '@mui/material';
import {setConfirmDialogProps} from '@store/reducers/uiTempGeometryDesigner';
import {PaperProps} from '@mui/material/Paper';
import {useDispatch} from 'react-redux';
import store from '@store/store';
import {IFlowNode} from '@gd/analysis/FlowNode';
import {ITest} from '@gd/analysis/ITest';
import EditableTypography from '@gdComponents/EditableTypography';
import useUpdate from '@app/hooks/useUpdate';
import * as Yup from 'yup';

export const FlowNodeDialog = React.memo(
  (props: {
    children: JSX.Element | JSX.Element[];
    test: ITest;
    node: IFlowNode;
    open: boolean;
    onClose: () => void;
    onApply?: () => void;
    onCancel?: () => void;
    paperProps?: PaperProps;
  }) => {
    const {children, open, node, test, onClose, onApply, onCancel, paperProps} =
      props;

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
    const update = useUpdate();

    const handleApply = React.useCallback(() => {
      node.isInitialState = false;
      test.saveLocalState();
      // test.asLastestState();
      const lastestID = test.getLocalStateID();
      test.squashLocalStates(stateAtOpen, lastestID);
      setStateAtOpen(lastestID);
      if (onApply) onApply();
    }, [onApply, node, test, stateAtOpen]);

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
        <EditableTypography
          typography={<DialogTitle>{node.name}</DialogTitle>}
          initialValue={node.name}
          validation={Yup.string().required('required')}
          onSubmit={(value) => {
            if (node.name !== value) {
              node.name = value;
              test.saveLocalState();
              update();
            }
          }}
          textFieldProps={{
            sx: {
              pt: 1,
              pl: 1,
              pr: 1,
              '& legend': {display: 'none'},
              '& fieldset': {top: 0}
            },
            InputProps: {
              sx: {color: '#000'}
            }
          }}
        />
        <DialogContent
          sx={{
            '&::-webkit-scrollbar': {
              display: 'none'
            }
          }}
        >
          {children}
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
export default FlowNodeDialog;
