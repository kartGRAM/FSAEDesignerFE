import React from 'react';
import {IDataControl} from '@gd/controls/IControls';
import {
  LinearBushingControl,
  isILinearBushingControl
} from '@gd/controls/LinearBushingControl';
import {useSelector} from 'react-redux';
import store, {RootState} from '@store/store';
import {IElement, isLinearBushing} from '@gd/IElements';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import Select from '@mui/material/Select';
import Box from '@mui/material/Box';
import {alpha} from '@mui/material/styles';
import usePrevious from '@app/hooks/usePrevious';
import {LinearBushingControlSettings} from './LinearBushingControl';

export interface ControlDefinitionProps {
  control: IDataControl | undefined;
  disabled: boolean;
  inputButton: string;
  setStaged: React.Dispatch<React.SetStateAction<null | IDataControl | string>>;
}

export function ControlDefinition(props: ControlDefinitionProps) {
  const {control, disabled, setStaged, inputButton} = props;

  const zindex = useSelector(
    (state: RootState) =>
      state.uitgd.fullScreenZIndex +
      state.uitgd.dialogZIndex +
      state.uitgd.menuZIndex
  );

  const [selectedID, setSelectedID] = React.useState<string>(
    control?.targetElement ?? ''
  );
  const prevID = usePrevious(selectedID);

  const state = store.getState();
  const elements = (state.uitgd.collectedAssembly?.children ?? []).filter(
    (e) => e.controllable
  );
  const controllableElements = elements.reduce((prev, current) => {
    if (!(current.className in prev)) prev[current.className] = [];
    prev[current.className].push(current);
    return prev;
  }, {} as {[index: string]: IElement[]});

  let components = null;
  const element = elements.find((e) => e.nodeID === selectedID);
  if (inputButton !== '' && element && isLinearBushing(element)) {
    let controlImpl: LinearBushingControl;
    if (
      isILinearBushingControl(control) &&
      control.targetElement === element.nodeID
    ) {
      controlImpl = new LinearBushingControl(control);
    } else {
      controlImpl = new LinearBushingControl({
        type: 'keyboard',
        targetElement: element.nodeID,
        inputButton
      });
      if (prevID !== selectedID) {
        setTimeout(() => setStaged(controlImpl.getDataControl()), 0);
      }
    }
    components = (
      <LinearBushingControlSettings
        control={controlImpl}
        setStaged={setStaged}
      />
    );
  }

  return (
    <>
      <FormControl sx={{m: 3, minWidth: 320}}>
        <InputLabel
          htmlFor="component-select"
          sx={{
            color: disabled ? alpha('#000', 0.38) : undefined
          }}
        >
          Select a controllable component
        </InputLabel>
        <Select
          disabled={disabled}
          value={selectedID}
          label="Select a controllable component"
          MenuProps={{
            sx: {zIndex: zindex}
          }}
          onChange={(e) => {
            setSelectedID(e.target.value);
            if (e.target.value === '' && control) {
              setStaged(control.nodeID);
            }
          }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {Object.keys(controllableElements)
            .map((key) => [
              <ListSubheader key={key}>{key}</ListSubheader>,
              ...controllableElements[key].map((element) => (
                <MenuItem value={element.nodeID} key={element.nodeID}>
                  {element.name.value}
                </MenuItem>
              ))
            ])
            .flat()}
        </Select>
      </FormControl>
      <Box component="div" sx={{m: 3}}>
        {components}
      </Box>
    </>
  );
}
