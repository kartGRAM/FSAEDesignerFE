import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  DialogActions
} from '@mui/material';
import {PaperProps} from '@mui/material/Paper';
import {useSelector} from 'react-redux';
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
  onClose: (event: any, reason: string) => void;
  onApply?: () => void;
  onCancel?: () => boolean;
  applyDisabled?: boolean;
  paperProps?: PaperProps;
}) {
  const {
    children,
    open,
    node,
    test,
    onClose,
    onApply,
    onCancel,
    applyDisabled,
    paperProps
  } = props;
  const zindex =
    useSelector((state: RootState) => state.uitgd.fullScreenZIndex) +
    10000000001;

  const update = useUpdate();

  const handleApply = () => {
    if (onApply) onApply();
  };

  const handleOK = () => {
    if (onApply) onApply();
    onClose('', 'okClick');
  };

  const handleCancel = () => {
    if (onCancel) {
      if (!onCancel()) return;
    }
    onClose('', 'cancelClick');
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const window = document.getElementById('gdAppArea');
  return (
    <Dialog
      open={open}
      TransitionProps={{unmountOnExit: true}}
      container={window}
      maxWidth={false}
      onClose={onClose}
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
          node.name = value;
          test.saveLocalState();
          update();
        }}
        textFieldProps={{
          sx: {
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
      <DialogContent>{children}</DialogContent>

      <DialogActions>
        <Button onClick={handleApply} disabled={!applyDisabled}>
          Apply
        </Button>
        <Button onClick={handleOK} disabled={!applyDisabled}>
          OK
        </Button>
        <Button onClick={handleCancel}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
