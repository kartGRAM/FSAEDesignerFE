import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {
  setUIDisabled,
  setConfirmDialogProps
} from '@store/reducers/uiTempGeometryDesigner';
import {setControl, removeControl} from '@store/reducers/dataGeometryDesigner';

import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import {alpha} from '@mui/material/styles';
import {IDataControl} from '@gd/controls/IControls';
import FullLayoutKeyboard, {keysInv} from './FullLayoutKeyboard';
import {ControlDefinition} from './ControlDefinition';

export interface KeyBindingsDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const disabledKey =
  '{escape} {tab} {enter} {controlleft} {controlright} {f4} {f5} {f6} {f7} {f8} {f11}';

export function KeyBindingsDialog(props: KeyBindingsDialogProps) {
  const {open, setOpen} = props;
  const [selectedKey, setSelectedKey] = React.useState('');
  const [staged, setStaged] = React.useState<null | IDataControl | string>(
    null
  );

  const zindex = useSelector(
    (state: RootState) =>
      state.uitgd.fullScreenZIndex + state.uitgd.dialogZIndex
  );
  const dialogZIndex = useSelector(
    (state: RootState) => state.uitgd.dialogZIndex
  );
  const dispatch = useDispatch();

  const controls = useSelector(
    (state: RootState) => state.dgd.present.controls
  ).filter((c) => c.type === 'keyboard');

  const assignedKeys = controls.map((c) => keysInv(c.inputButton)).join(' ');

  const selectedControls = controls.filter(
    (c) => c.inputButton === selectedKey
  );

  React.useEffect(() => {
    if (open) {
      dispatch(setUIDisabled(true));
    } else {
      dispatch(setUIDisabled(false));
    }
  }, [open]);

  const handleApply = () => {
    if (!staged) return;

    if (typeof staged === 'string') {
      dispatch(removeControl(staged));
      setStaged(null);
      return;
    }
    dispatch(setControl(staged));
    setStaged(null);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOK = () => {
    handleApply();
    setOpen(false);
  };

  const options = {
    disableButtonHold: true,
    onKeyPress: async (button: string) => {
      if (disabledKey.split(' ').includes(keysInv(button))) return;
      if (staged) {
        const ret = await new Promise<string>((resolve) => {
          dispatch(
            setConfirmDialogProps({
              zindex: zindex + dialogZIndex,
              onClose: resolve,
              title: 'Confirm',
              message: `Control bindings have been changed. Do you save changes?`,
              buttons: [
                {text: 'Save', res: 'save'},
                {text: "Don't save", res: 'noSave'},
                {text: 'Cancel', res: 'cancel', autoFocus: true}
              ]
            })
          );
        });
        dispatch(setConfirmDialogProps(undefined));
        if (ret === 'cancel') return;
        if (ret === 'save') handleApply();
        else {
          await setStaged(null);
        }
      }
      if (selectedKey !== button) {
        setSelectedKey(button);
      } else {
        setSelectedKey('');
      }
    },
    buttonTheme: [
      {
        class: 'disabled',
        buttons: disabledKey
      }
    ]
  };
  if (assignedKeys !== '')
    options.buttonTheme.push({
      class: 'assigned',
      buttons: assignedKeys
    });
  if (selectedKey !== '')
    options.buttonTheme.push({
      class: 'selected',
      buttons: keysInv(selectedKey)
    });

  return (
    <Dialog
      open={open}
      // onClose={onClose}
      sx={{
        zIndex: `${zindex}!important`
      }}
      PaperProps={{sx: {maxWidth: 'unset', width: '960px'}}}
    >
      <DialogTitle>Key Bindings Dialog</DialogTitle>
      <DialogContent
        sx={{
          '& .hg-button.assigned': {
            background: alpha('#019fb6', 1),
            color: 'white'
          },
          '& .hg-button.selected': {
            background: alpha('#F00', 0.7),
            color: 'white'
          },
          '& .hg-button.disabled': {
            background: alpha('#000', 0.5),
            color: 'white'
          }
        }}
      >
        <FullLayoutKeyboard {...options} />
        {[
          ...selectedControls.map((control) => (
            <ControlDefinition
              setStaged={setStaged}
              control={control}
              disabled={selectedKey === ''}
              inputButton={selectedKey}
              key={control.nodeID}
            />
          )),
          <ControlDefinition
            setStaged={setStaged}
            disabled={selectedKey === ''}
            inputButton={selectedKey}
            key={selectedKey}
          />
        ]}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleApply} disabled={!staged}>
          Apply
        </Button>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleOK}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}
