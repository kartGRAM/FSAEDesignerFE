/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {IFromElementBasePlane} from '@gd/measure/IPlaneObjects';
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
    if (point !== '' && line !== '') {
      const obj: IFromElementBasePlane = new FromElementBasePlaneObject({
        name: `datum point`,
        point,
        line
      });
      setApplyReady(obj);
    } else {
      setApplyReady(undefined);
    }
    dispatch(setForceVisibledDatums([point, line]));
    return () => {
      dispatch(setForceVisibledDatums([]));
    };
  }, [element]);

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
            sx: {zIndex: 150000000000}
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
          title="Select a component"
          onClick={handleGetElement}
          disabled={selectMode}
        />
      </FormControl>
    </Box>
  );
}
