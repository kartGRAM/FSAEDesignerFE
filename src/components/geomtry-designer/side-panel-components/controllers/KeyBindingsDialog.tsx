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
import {IControl} from '@gd/IControls';
import FullLayoutKeyboard, {keys} from './FullLayoutKeyboard';
import {ControlDefinition} from './ControlDefinition';

export interface KeyBindingsDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const disabledKey =
  '{escape} {tab} {enter} {controlleft} {controlright} {f7} {f8}';
export function KeyBindingsDialog(props: KeyBindingsDialogProps) {
  const {open, setOpen} = props;
  const [selectedKey, setSelectedKey] = React.useState('');
  const [staged, setStaged] = React.useState<null | IControl | string>(null);

  const zindex =
    useSelector((state: RootState) => state.uitgd.fullScreenZIndex) + 1000;
  const dispatch = useDispatch();

  const controls = useSelector(
    (state: RootState) => state.dgd.present.controls
  ).filter((c) => c.type === 'keyboard');

  const assignedKeys = controls.map((c) => c.inputButton).join(' ');

  const selectedControl = controls.find(
    (c) => c.inputButton === keys(selectedKey)
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
      if (staged) {
        const ret = await new Promise<string>((resolve) => {
          dispatch(
            setConfirmDialogProps({
              zindex: zindex + 10000 + 1,
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
      buttons: selectedKey
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
        <ControlDefinition
          setStaged={setStaged}
          control={selectedControl}
          disabled={selectedKey === ''}
          inputButton={selectedKey}
          key={selectedKey}
        />
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
