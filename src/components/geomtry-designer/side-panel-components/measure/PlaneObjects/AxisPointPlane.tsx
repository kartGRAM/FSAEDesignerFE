/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {IAxisPointPlane} from '@gd/measure/IPlaneObjects';
import {AxisPointPlane as AxisPointPlaneObject} from '@gd/measure/PlaneObjects';
import {IDatumObject, isPoint, isLine} from '@gd/measure/IDatumObjects';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import {setComponentVisualizationMode} from '@store/reducers/uiGeometryDesigner';
import {
  setDatumPointSelectMode,
  setDatumPointSelected,
  setDatumLineSelectMode,
  setDatumLineSelected,
  setForceVisibledDatums
} from '@store/reducers/uiTempGeometryDesigner';
import MenuItem from '@mui/material/MenuItem';
import Target from '@gdComponents/svgs/Target';

export function AxisPointPlane(props: {
  plane?: IAxisPointPlane;
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {plane, setApplyReady} = props;

  const dispatch = useDispatch();
  const ids = [React.useId(), React.useId(), React.useId()];
  const [visModeRestored, setVisModeRestored] = React.useState(
    store.getState().uigd.present.gdSceneState.componentVisualizationMode
  );

  const selectedPoint = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumPointSelected
  );

  const selectedLine = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumLineSelected
  );

  const selectMode = useSelector(
    (state: RootState) =>
      state.uitgd.gdSceneState.datumPointSelectMode ||
      state.uitgd.gdSceneState.datumLineSelectMode
  );

  const datumManager = useSelector(
    (state: RootState) => state.uitgd.datumManager
  );

  const datumObjectsAll = datumManager?.getObjectsAll() ?? [];

  const idx = datumObjectsAll.findIndex((d) => d.nodeID === plane?.nodeID);

  const pointObjects = datumObjectsAll
    .slice(0, idx === -1 ? undefined : idx)
    .filter((datum) => isPoint(datum));
  const lineObjects = datumObjectsAll
    .slice(0, idx === -1 ? undefined : idx)
    .filter((datum) => isLine(datum));

  const defaultPoint = plane?.point ?? '';
  const defaultLine = plane?.line ?? '';

  const [point, setPoint] = React.useState(defaultPoint);
  const [line, setLine] = React.useState(defaultLine);

  const handleGetDatum = (i: number) => {
    if (i === 0) {
      dispatch(setDatumPointSelectMode(true));
    } else {
      dispatch(setDatumLineSelectMode(true));
    }
  };

  const onResetSetterMode = () => {
    dispatch(setDatumPointSelected(''));
    dispatch(setDatumLineSelected(''));
    dispatch(setDatumPointSelectMode(false));
    dispatch(setDatumLineSelectMode(false));
  };

  const shortCutKeys = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onResetSetterMode();
    }
  };

  React.useEffect(() => {
    setVisModeRestored(
      store.getState().uigd.present.gdSceneState.componentVisualizationMode
    );
    dispatch(setDatumPointSelectMode(false));
    dispatch(setDatumLineSelectMode(false));
    dispatch(setComponentVisualizationMode('WireFrameOnly'));

    window.addEventListener('keydown', shortCutKeys, true);
    return () => {
      dispatch(setComponentVisualizationMode(visModeRestored));
      dispatch(setDatumPointSelectMode(false));
      dispatch(setDatumLineSelectMode(false));
      window.removeEventListener('keydown', shortCutKeys, true);
    };
  }, []);

  React.useEffect(() => {
    if (
      pointObjects.find((datum) => datum.nodeID === selectedPoint) &&
      selectedPoint !== point
    ) {
      setPoint(selectedPoint);
    }
    onResetSetterMode();
  }, [selectedPoint]);

  React.useEffect(() => {
    if (
      lineObjects.find((datum) => datum.nodeID === selectedLine) &&
      selectedLine !== line
    ) {
      setLine(selectedLine);
    }
    onResetSetterMode();
  }, [selectedLine]);

  React.useEffect(() => {
    if (point !== '' && line !== '') {
      const obj: IAxisPointPlane = new AxisPointPlaneObject({
        name: `datum plane`,
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
  }, [point, line]);

  const handleChanged = (nodeID: string, i: number) => {
    if (i === 0) {
      setPoint(nodeID);
    } else {
      setLine(nodeID);
    }
  };

  return (
    <Box component="div">
      {['Select point', 'Select line'].map((str, i) => (
        <FormControl
          key={str}
          sx={{
            m: 1,
            mt: 3,
            minWidth: 250,
            display: 'flex',
            flexDirection: 'row'
          }}
        >
          <InputLabel htmlFor={ids[i]}>{str}</InputLabel>
          <Select
            disabled={selectMode}
            value={[point, line][i]}
            id={ids[i]}
            label={str}
            onChange={(e) => handleChanged(e.target.value, i)}
            sx={{flexGrow: '1'}}
            MenuProps={{
              sx: {zIndex: 150000000000}
            }}
          >
            <MenuItem aria-label="None" value="">
              <em>None</em>
            </MenuItem>
            {[pointObjects, lineObjects][i].map((datum) => (
              <MenuItem value={datum.nodeID} key={datum.nodeID}>
                {datum.name}
              </MenuItem>
            ))}
          </Select>
          <Target
            title={str}
            onClick={() => handleGetDatum(i)}
            disabled={selectMode}
          />
        </FormControl>
      ))}
    </Box>
  );
}