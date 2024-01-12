import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import {NativeSelect, Divider, Box, Typography} from '@mui/material';
import DialogContent from '@mui/material/DialogContent';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {
  setUIDisabled,
  setConfirmDialogProps
} from '@store/reducers/uiTempGeometryDesigner';
import {assemblyModes, Options} from '@gd/ISaveData';
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

  const assemblyModeDgd = useSelector(
    (state: RootState) => state.dgd.present.options.assemblyMode
  );
  const [assemblyMode, setAssemblyMode] =
    React.useState<Options['assemblyMode']>(assemblyModeDgd);
  const [selectedKey, setSelectedKey] = React.useState('');
  const [staged, setStaged] = React.useState<null | IDataControl | string>(
    null
  );
  const [prefix, resetNewDefinition] = React.useState<Boolean>(false);

  const {uitgd} = store.getState();
  const zindex = uitgd.fullScreenZIndex + uitgd.dialogZIndex;
  const {dialogZIndex} = uitgd;
  const dispatch = useDispatch();

  const controls = useSelector(
    (state: RootState) => state.dgd.present.controls
  ).filter(
    (c) =>
      c.type === 'keyboard' &&
      (c.configuration ?? 'FixedFrame') === assemblyMode
  );

  const assignedKeys = controls.map((c) => keysInv(c.inputButton)).join(' ');

  const selectedControls = controls.filter(
    (c) => c.inputButton === selectedKey
  );

  React.useEffect(() => {
    if (open) {
      dispatch(setUIDisabled(true));
    } else {
      dispatch(setUIDisabled(false));
      setStaged(null);
    }
  }, [dispatch, open]);

  const handleApply = () => {
    if (!staged) return;

    if (typeof staged === 'string') {
      dispatch(removeControl(staged));
      setStaged(null);
      resetNewDefinition((prev) => !prev);
      return;
    }
    staged.configuration = assemblyMode;
    dispatch(setControl(staged));
    setStaged(null);
    resetNewDefinition((prev) => !prev);
  };

  const handleClose = async () => {
    if (await confirm()) setOpen(false);
  };

  const handleOK = () => {
    handleApply();
    setOpen(false);
  };

  const confirm = async () => {
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
      if (ret === 'cancel') return false;
      if (ret === 'save') handleApply();
      else {
        await setStaged(null);
      }
    }
    return true;
  };

  const options = {
    disableButtonHold: true,
    onKeyPress: async (button: string) => {
      if (disabledKey.split(' ').includes(keysInv(button))) return;
      if (!(await confirm())) return;
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

  const onConfigChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const {value} = e.target;
    if (await confirm()) {
      setAssemblyMode(value as any);
    }
  };

  return (
    <Dialog
      open={open}
      // onClose={onClose}
      sx={{
        zIndex: `${zindex}!important`
      }}
      PaperProps={{sx: {maxWidth: 'unset', width: '960px'}}}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
      >
        Key Bindings Dialog
        <Box
          component="div"
          sx={{display: 'flex', flexDirection: 'row', alignItems: 'baseline'}}
        >
          <Typography sx={{pr: 1}}>configuration:</Typography>
          <NativeSelect
            variant="standard"
            value={assemblyMode}
            onChange={onConfigChange}
          >
            {assemblyModes.map((mode) => (
              <option value={mode}>{mode}</option>
            ))}
          </NativeSelect>
        </Box>
      </DialogTitle>
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
        <FullLayoutKeyboard {...options} key="keyboad" />
        {[
          ...selectedControls
            .map((control) => [
              <ControlDefinition
                assemblyMode={assemblyMode}
                setStaged={setStaged}
                control={control}
                disabled={selectedKey === ''}
                inputButton={selectedKey}
                key={control.nodeID}
              />,
              <Divider key={`${control.nodeID}hr`} />
            ])
            .flat(),
          <ControlDefinition
            assemblyMode={assemblyMode}
            setStaged={setStaged}
            disabled={selectedKey === ''}
            inputButton={selectedKey}
            key={prefix + selectedKey}
          />
        ]}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleApply} key="apply" disabled={!staged}>
          Apply
        </Button>
        <Button onClick={handleClose} key="cancel">
          Cancel
        </Button>
        <Button onClick={handleOK} key="OK">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
