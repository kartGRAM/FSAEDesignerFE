import React from 'react';
import {IControl} from '@gd/IControls';
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
import {LinearBushingControl} from './LinearBushingControl';

export interface ControlDefinitionProps {
  control: IControl | undefined;
  disabled: boolean;
}

export function ControlDefinition(props: ControlDefinitionProps) {
  const {control, disabled} = props;
  const zindex =
    useSelector((state: RootState) => state.uitgd.fullScreenZIndex) + 1200;
  const [selectedID, setSelectedID] = React.useState<string>(
    control?.targetElement ?? ''
  );

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
  if (element && isLinearBushing(element)) {
    components = <LinearBushingControl control={control} element={element} />;
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
          defaultValue=""
          id="component-select"
          label="Select a controllable component"
          MenuProps={{
            sx: {zIndex: zindex}
          }}
          onChange={(e) => setSelectedID(e.target.value)}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {Object.keys(controllableElements)
            .map((key) => [
              <ListSubheader>{key}</ListSubheader>,
              ...controllableElements[key].map((element) => (
                <MenuItem value={element.nodeID}>{element.name.value}</MenuItem>
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
