import React from 'react';
import {IDataControl} from '@gd/controls/IControls';
import {getControl} from '@gd/controls/Controls';
import {
  LinearBushingControl,
  isDataLinearBushingControl
} from '@gd/controls/LinearBushingControl';
import {
  DistanceControl,
  isDataDistanceControl
} from '@gd/controls/DistanceControl';
import {
  PointToPlaneControl,
  isDataPointToPlaneControl
} from '@gd/controls/PointToPlaneControl';
import {
  SkidpadSolverControl,
  isDataSkidpadSolverControl
} from '@gd/controls/SkidpadSolverControl';
import {
  ExistingConstraintControl,
  isDataExistingConstraintControl
} from '@gd/controls/ExistingConstraintControl';

import store from '@store/store';
import {IElement} from '@gd/IElements';
import {isLinearBushing} from '@gd/IElements/ILinearBushing';
import {isSpringDumper} from '@gd/IElements/ISpringDumper';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import Select from '@mui/material/Select';
import Box from '@mui/material/Box';
import {alpha} from '@mui/material/styles';
import usePrevious from '@app/hooks/usePrevious';
import EditableTypography from '@gdComponents/EditableTypography';
import * as Yup from 'yup';
import {Typography} from '@mui/material';
import {LinearBushingControlSettings} from './LinearBushingControl';
import {DistanceControlSettings} from './DistanceControl';
import {PointToPlaneControlSettings} from './PointToPlaneControl';
import {SkidpadSolverControlSettings} from './SkidpadSolverControl';
import {ExistingConstraintControlSettings} from './ExistingConstraintControl';

export interface ControlDefinitionProps {
  control?: IDataControl;
  disabled: boolean;
  inputButton: string;
  setStaged: React.Dispatch<React.SetStateAction<null | IDataControl | string>>;
  assemblyMode: IDataControl['configuration'];
}

export function ControlDefinition(props: ControlDefinitionProps) {
  const {control, disabled, setStaged, inputButton, assemblyMode} = props;
  const controlInstance = control ? getControl(control) : undefined;
  const [name, setName] = React.useState<string>(controlInstance?.name ?? '');

  const {uitgd} = store.getState();
  const zindex = uitgd.fullScreenZIndex + uitgd.dialogZIndex + uitgd.menuZIndex;

  let initialSelectedID: string = '';
  if (isDataPointToPlaneControl(control))
    initialSelectedID = PointToPlaneControl.className;
  else if (isDataExistingConstraintControl(control))
    initialSelectedID = ExistingConstraintControl.className;
  else if (isDataSkidpadSolverControl(control))
    initialSelectedID = SkidpadSolverControl.className;
  else {
    initialSelectedID = control?.targetElements[0] ?? '';
  }

  const [selectedID, setSelectedID] = React.useState<string>(initialSelectedID);
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
      isDataLinearBushingControl(control) &&
      /* control.targetElements && */
      control.targetElements[0] === element.nodeID
    ) {
      controlImpl = new LinearBushingControl(control);
    } else {
      controlImpl = new LinearBushingControl({
        type: 'keyboard',
        targetElements: [element.nodeID],
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
  if (inputButton !== '' && element && isSpringDumper(element)) {
    let controlImpl: DistanceControl;
    if (
      isDataDistanceControl(control) &&
      /* control.targetElements && */
      control.targetElements[0] === element.nodeID
    ) {
      controlImpl = new DistanceControl(control);
    } else {
      controlImpl = new DistanceControl({
        type: 'keyboard',
        targetElements: [element.nodeID],
        inputButton
      });
      if (prevID !== selectedID) {
        setTimeout(() => setStaged(controlImpl.getDataControl()), 0);
      }
    }
    components = (
      <DistanceControlSettings control={controlImpl} setStaged={setStaged} />
    );
  }
  if (inputButton !== '' && selectedID === PointToPlaneControl.className) {
    let controlImpl: PointToPlaneControl;
    if (isDataPointToPlaneControl(control)) {
      controlImpl = new PointToPlaneControl(control);
    } else {
      controlImpl = new PointToPlaneControl({
        type: 'keyboard',
        targetElements: [],
        inputButton
      });
      if (prevID !== selectedID) {
        setTimeout(() => setStaged(controlImpl.getDataControl()), 0);
      }
    }
    components = (
      <PointToPlaneControlSettings
        control={controlImpl}
        setStaged={setStaged}
      />
    );
  }
  if (inputButton !== '' && selectedID === SkidpadSolverControl.className) {
    let controlImpl: SkidpadSolverControl;
    if (isDataSkidpadSolverControl(control)) {
      controlImpl = new SkidpadSolverControl(control);
    } else {
      controlImpl = new SkidpadSolverControl({
        type: 'keyboard',
        targetElements: [],
        inputButton
      });
      if (prevID !== selectedID) {
        setTimeout(() => setStaged(controlImpl.getDataControl()), 0);
      }
    }
    components = (
      <SkidpadSolverControlSettings
        control={controlImpl}
        setStaged={setStaged}
      />
    );
  }
  if (
    inputButton !== '' &&
    selectedID === ExistingConstraintControl.className
  ) {
    let controlImpl: ExistingConstraintControl;
    if (isDataExistingConstraintControl(control)) {
      controlImpl = new ExistingConstraintControl(control);
    } else {
      controlImpl = new ExistingConstraintControl({
        type: 'keyboard',
        targetControl: '',
        inputButton
      });
      if (prevID !== selectedID) {
        setTimeout(() => setStaged(controlImpl.getDataControl()), 0);
      }
    }
    components = (
      <ExistingConstraintControlSettings
        control={controlImpl}
        setStaged={setStaged}
        assemblyMode={assemblyMode}
      />
    );
  }

  return (
    <>
      <Box
        component="div"
        sx={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}
      >
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
            <ListSubheader key="GeometricConstraints">
              Geometric constraints
            </ListSubheader>
            <MenuItem value={SkidpadSolverControl.className}>
              Two-Dimensional Constraint
            </MenuItem>
            <MenuItem value={ExistingConstraintControl.className}>
              Another Control for Existing Constraint
            </MenuItem>
            <ListSubheader key="SolverControl">Solver control</ListSubheader>
            <MenuItem value={SkidpadSolverControl.className}>
              Skidpad solver parameter control
            </MenuItem>
          </Select>
        </FormControl>
        {controlInstance ? (
          <EditableTypography
            typography={<Typography>{name}</Typography>}
            initialValue={name}
            validation={Yup.string().required('required')}
            onSubmit={(value) => {
              controlInstance.name = value;
              setName(value);
              setStaged(controlInstance.getDataControl());
            }}
            textFieldProps={{
              sx: {
                pt: 1,
                pl: 1,
                pr: 1,
                flexGrow: 1,
                '& legend': {display: 'none'},
                '& fieldset': {top: 0}
              },
              InputProps: {
                sx: {color: '#000'}
              }
            }}
          />
        ) : null}
      </Box>
      <Box component="div" sx={{m: 3}}>
        {components}
      </Box>
    </>
  );
}
