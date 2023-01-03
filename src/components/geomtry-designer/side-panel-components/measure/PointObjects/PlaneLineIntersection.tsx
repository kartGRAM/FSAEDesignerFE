/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {IPlaneLineIntersection} from '@gd/measure/IPointObjects';
import {PlaneLineIntersection as PlaneLineIntersectionObject} from '@gd/measure/PointObjects';
import {IDatumObject, isPlane, isLine} from '@gd/measure/IDatumObjects';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import {setComponentVisualizationMode} from '@store/reducers/uiGeometryDesigner';
import {
  setDatumPlaneSelectMode,
  setDatumPlaneSelected,
  setDatumLineSelectMode,
  setDatumLineSelected,
  setForceVisibledDatums
} from '@store/reducers/uiTempGeometryDesigner';
import MenuItem from '@mui/material/MenuItem';
import Target from '@gdComponents/svgs/Target';

export function PlaneLineIntersection(props: {
  point?: IPlaneLineIntersection;
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {point, setApplyReady} = props;

  const dispatch = useDispatch();
  const ids = [React.useId(), React.useId(), React.useId()];
  const [visModeRestored, setVisModeRestored] = React.useState(
    store.getState().uigd.present.gdSceneState.componentVisualizationMode
  );

  const selectedPlane = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumPlaneSelected
  );

  const selectedLine = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumLineSelected
  );

  const selectMode = useSelector(
    (state: RootState) =>
      state.uitgd.gdSceneState.datumPlaneSelectMode ||
      state.uitgd.gdSceneState.datumLineSelectMode
  );

  const datumManager = useSelector(
    (state: RootState) => state.uitgd.datumManager
  );

  const datumObjectsAll = datumManager?.getObjectsAll() ?? [];

  const idx = datumObjectsAll.findIndex((d) => d.nodeID === point?.nodeID);

  const planeObjects = datumObjectsAll
    .slice(0, idx === -1 ? undefined : idx)
    .filter((datum) => isPlane(datum));
  const lineObjects = datumObjectsAll
    .slice(0, idx === -1 ? undefined : idx)
    .filter((datum) => isLine(datum));

  const defaultPlane = point?.plane ?? '';
  const defaultLine = point?.line ?? '';

  const [plane, setPlane] = React.useState(defaultPlane);
  const [line, setLine] = React.useState(defaultLine);

  const handleGetDatum = (i: number) => {
    if (i === 0) {
      dispatch(setDatumPlaneSelectMode(true));
    } else {
      dispatch(setDatumLineSelectMode(true));
    }
  };

  const onResetSetterMode = () => {
    dispatch(setDatumPlaneSelected(''));
    dispatch(setDatumLineSelected(''));
    dispatch(setDatumPlaneSelectMode(false));
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
    dispatch(setDatumPlaneSelectMode(false));
    dispatch(setDatumLineSelectMode(false));
    dispatch(setComponentVisualizationMode('WireFrameOnly'));

    window.addEventListener('keydown', shortCutKeys, true);
    return () => {
      dispatch(setComponentVisualizationMode(visModeRestored));
      dispatch(setDatumPlaneSelectMode(false));
      dispatch(setDatumLineSelectMode(false));
      window.removeEventListener('keydown', shortCutKeys, true);
    };
  }, []);

  React.useEffect(() => {
    if (
      planeObjects.find((datum) => datum.nodeID === selectedPlane) &&
      selectedPlane !== plane
    ) {
      setPlane(selectedPlane);
    }
    onResetSetterMode();
  }, [selectedPlane]);

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
    if (plane !== '' && line !== '') {
      const obj: IPlaneLineIntersection = new PlaneLineIntersectionObject({
        name: `datum point`,
        plane,
        line
      });
      setApplyReady(obj);
    } else {
      setApplyReady(undefined);
    }
    dispatch(setForceVisibledDatums([plane, line]));
    return () => {
      dispatch(setForceVisibledDatums([]));
    };
  }, [point, line]);

  const handleChanged = (nodeID: string, i: number) => {
    if (i === 0) {
      setPlane(nodeID);
    } else {
      setLine(nodeID);
    }
  };

  return (
    <Box component="div">
      {['Select plnae', 'Select line'].map((str, i) => (
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
            value={[plane, line][i]}
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
            {[planeObjects, lineObjects][i].map((datum) => (
              <MenuItem value={datum.nodeID} key={datum.nodeID}>
                {datum.name}
              </MenuItem>
            ))}
          </Select>
          <Target
            sx={{mt: 1}}
            title={str}
            onClick={() => handleGetDatum(i)}
            disabled={selectMode}
          />
        </FormControl>
      ))}
    </Box>
  );
}
