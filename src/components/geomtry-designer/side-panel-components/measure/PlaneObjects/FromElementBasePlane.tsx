/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {BasePlane, IFromElementBasePlane} from '@gd/measure/IPlaneObjects';
import {FromElementBasePlane as FromElementBasePlaneObject} from '@gd/measure/PlaneObjects';
import {IDatumObject, isPoint, isLine} from '@gd/measure/IDatumObjects';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import {
  setDatumElementSelectMode,
  setForceVisibledDatums
} from '@store/reducers/uiTempGeometryDesigner';
import MenuItem from '@mui/material/MenuItem';
import Target from '@gdComponents/svgs/Target';
import Scalar from '@gdComponents/Scalar';
import {NamedNumber} from '@gd/NamedValues';

const directions: BasePlane[] = ['XY', 'YZ', 'ZX'];

export function FromElementBasePlane(props: {
  plane?: IFromElementBasePlane;
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {plane, setApplyReady} = props;

  const dispatch = useDispatch();
  const ids = [React.useId(), React.useId(), React.useId()];

  const selectedElement = useSelector(
    (state: RootState) => state.uitgd.selectedElementAbsPath
  ).split('@')[0];

  const selectMode = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumElementSelectMode
  );

  const assembly = useSelector(
    (state: RootState) => state.uitgd.collectedAssembly
  );

  const children = assembly?.children ?? [];

  const defaultElement = children.find(
    (child) => child.nodeID === plane?.element
  );
  const [element, setElement] = React.useState(defaultElement?.nodeID ?? '');
  const [distance, setDistance] = React.useState(
    new NamedNumber({value: plane?.distance.getStringValue() ?? 0})
  );
  const [direction, setDirection] = React.useState<BasePlane | ''>(
    plane?.direction ?? ''
  );

  const handleGetElement = () => {
    dispatch(setDatumElementSelectMode(true));
  };

  const onResetSetterMode = () => {
    dispatch(setDatumElementSelectMode(false));
  };

  const shortCutKeys = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onResetSetterMode();
    }
  };

  React.useEffect(() => {
    dispatch(setDatumElementSelectMode(false));
    window.addEventListener('keydown', shortCutKeys, true);
    return () => {
      dispatch(setDatumElementSelectMode(false));
      window.removeEventListener('keydown', shortCutKeys, true);
    };
  }, []);

  React.useEffect(() => {
    if (
      children.find((child) => child.nodeID === selectedElement) &&
      selectedElement !== element
    ) {
      setElement(selectedElement);
    }
    onResetSetterMode();
  }, [selectedElement]);

  React.useEffect(() => {
    if (element !== '' && direction !== '') {
      const obj: IFromElementBasePlane = new FromElementBasePlaneObject({
        name: `datum plane`,
        element,
        distance: distance.getStringValue(),
        direction
      });
      setApplyReady(obj);
    } else {
      setApplyReady(undefined);
    }
  }, [element, distance, direction]);

  const menuZIndex = useSelector(
    (state: RootState) =>
      state.uitgd.fullScreenZIndex +
      state.uitgd.menuZIndex +
      state.uitgd.dialogZIndex
  );

  return (
    <Box component="div">
      <FormControl
        sx={{
          m: 1,
          mt: 3,
          minWidth: 250,
          display: 'flex',
          flexDirection: 'row'
        }}
      >
        <InputLabel htmlFor={ids[0]}>Select a component</InputLabel>
        <Select
          disabled={selectMode}
          value={element}
          id={ids[0]}
          label="Select a component"
          onChange={(e) => setElement(e.target.value)}
          sx={{flexGrow: '1'}}
          MenuProps={{
            sx: {zIndex: menuZIndex}
          }}
        >
          <MenuItem aria-label="None" value="">
            <em>None</em>
          </MenuItem>
          {children.map((child) => (
            <MenuItem value={child.nodeID} key={child.nodeID}>
              {child.name.value}
            </MenuItem>
          ))}
        </Select>
        <Target
          sx={{mt: 1}}
          title="Select a component"
          onClick={handleGetElement}
          disabled={selectMode}
        />
      </FormControl>
      <FormControl
        sx={{
          m: 1,
          mt: 3,
          minWidth: 250,
          display: 'flex',
          flexDirection: 'row'
        }}
      >
        <InputLabel htmlFor={ids[1]}>Select direction</InputLabel>
        <Select
          disabled={selectMode}
          value={direction}
          id={ids[1]}
          label="Select direction"
          onChange={(e) => setDirection(e.target.value as BasePlane)}
          sx={{flexGrow: '1'}}
          MenuProps={{
            sx: {zIndex: menuZIndex}
          }}
        >
          <MenuItem aria-label="None" value="">
            <em>None</em>
          </MenuItem>
          {directions.map((direction) => (
            <MenuItem value={direction} key={direction}>
              {direction}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Scalar
        value={distance}
        unit="mm"
        disabled={selectMode}
        onUpdate={() => {
          setDistance(
            new NamedNumber({
              name: 'distance',
              value: distance.getStringValue()
            })
          );
        }}
      />
    </Box>
  );
}
