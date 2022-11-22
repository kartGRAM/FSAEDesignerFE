import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {setUIDisabled} from '@store/reducers/uiTempGeometryDesigner';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import {alpha} from '@mui/material/styles';
import FullLayoutKeyboard from './FullLayoutKeyboard';

export interface KeyBindingsDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const disabledKey = '{escape} {tab} {enter} {controlleft} {controlright} f7 f8';
export function KeyBindingsDialog(props: KeyBindingsDialogProps) {
  const {open, setOpen} = props;
  const [selectedKey, setSelectedKey] = React.useState('');

  const zindex =
    useSelector((state: RootState) => state.uitgd.fullScreenZIndex) + 1000;
  const dispatch = useDispatch();

  const controls = useSelector(
    (state: RootState) => state.dgd.present.controls
  ).filter((c) => c.type === 'keyboard');
  const assignedKeys = controls.map((c) => c.inputButton).join(' ');

  React.useEffect(() => {
    if (open) {
      dispatch(setUIDisabled(true));
    } else {
      dispatch(setUIDisabled(false));
    }
  }, [open]);

  const handleApply = () => {};

  const handleClose = () => {
    setOpen(false);
  };

  const handleOKClick = () => {
    setOpen(false);
  };

  const options = {
    disableButtonHold: true,
    onKeyPress: (button: string) => {
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
      class: 'assinged',
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
      </DialogContent>

      <DialogActions>
        <Button onClick={handleApply}>Apply</Button>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleOKClick}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}
