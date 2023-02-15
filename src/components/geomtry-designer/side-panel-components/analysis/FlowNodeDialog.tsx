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
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {IFlowNode} from '@gd/analysis/FlowNode';
import {ITest} from '@gd/analysis/ITest';
import EditableTypography from '@gdComponents/EditableTypography';
import useUpdate from '@app/hooks/useUpdate';
import * as Yup from 'yup';

export default function FlowNodeDialog(props: {
  children: JSX.Element | JSX.Element[];
  test: ITest;
  node: IFlowNode;
  open: boolean;
  onClose: () => void;
  onApply?: () => void;
  onCancel?: () => void;
  paperProps?: PaperProps;
}) {
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
  }, [open]);

  const zindex =
    useSelector((state: RootState) => state.uitgd.fullScreenZIndex) +
    10000000001;

  const changed = stateAtOpen !== test.getLocalStateID();
  const update = useUpdate();

  const handleApply = () => {
    if (onApply) onApply();
    node.isInitialState = false;
    test.saveLocalState();
    // test.asLastestState();
    const lastestID = test.getLocalStateID();
    test.squashLocalStates(stateAtOpen, lastestID);
    setStateAtOpen(lastestID);
  };

  const handleOK = async () => {
    handleApply();
    onClose();
  };

  const handleCancel = async () => {
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
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const window = document.getElementById('gdAppArea');
  return (
    <Dialog
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
      PaperProps={
        paperProps || {
          sx: {minWidth: '60%', height: '60%'}
        }
      }
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
