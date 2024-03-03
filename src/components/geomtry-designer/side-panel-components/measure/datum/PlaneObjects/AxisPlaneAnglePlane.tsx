import React from 'react';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {IAxisPlaneAnglePlane} from '@gd/measure/datum/IPlaneObjects';
import {AxisPlaneAnglePlane as AxisPlaneAnglePlaneObject} from '@gd/measure/datum/PlaneObjects';
import {IDatumObject, isPlane, isLine} from '@gd/measure/datum/IDatumObjects';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
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
import useUpdateEffect from '@hooks/useUpdateEffect';
import Scalar from '@gdComponents/Scalar';
import {NamedNumber} from '@gd/NamedValues';

export function AxisPlaneAnglePlane(props: {
  plane?: IAxisPlaneAnglePlane;
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {plane, setApplyReady} = props;

  const dispatch = useDispatch();
  const ids = [React.useId(), React.useId(), React.useId()];
  const [visModeRestored, setVisModeRestored] = React.useState(
    store.getState().uigd.gdSceneState.componentVisualizationMode
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

  const idx = datumObjectsAll.findIndex((d) => d.nodeID === plane?.nodeID);

  const otherPlaneObjects = datumObjectsAll
    .slice(0, idx === -1 ? undefined : idx)
    .filter((datum) => isPlane(datum));
  const lineObjects = datumObjectsAll
    .slice(0, idx === -1 ? undefined : idx)
    .filter((datum) => isLine(datum));

  const defaultPlane = plane?.plane ?? '';
  const defaultLine = plane?.line ?? '';

  const [otherPlane, setPlane] = React.useState(defaultPlane);
  const [line, setLine] = React.useState(defaultLine);
  const [angle, setAngle] = React.useState(
    new NamedNumber({
      name: 'angle',
      value: plane?.angle.getStringValue() ?? 0
    })
  );

  const handleGetDatum = (i: number) => {
    if (i === 0) {
      dispatch(setDatumPlaneSelectMode(true));
    } else {
      dispatch(setDatumLineSelectMode(true));
    }
  };

  const onResetSetterMode = React.useCallback(() => {
    dispatch(setDatumPlaneSelected(''));
    dispatch(setDatumLineSelected(''));
    dispatch(setDatumPlaneSelectMode(false));
    dispatch(setDatumLineSelectMode(false));
  }, [dispatch]);

  const shortCutKeys = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onResetSetterMode();
      }
    },
    [onResetSetterMode]
  );

  React.useEffect(() => {
    setVisModeRestored(
      store.getState().uigd.gdSceneState.componentVisualizationMode
    );
    dispatch(setDatumPlaneSelectMode(false));
    dispatch(setDatumLineSelectMode(false));
    dispatch(setComponentVisualizationMode('WireFrameOnly'));
    dispatch(setForceVisibledDatums([otherPlane, line]));
    window.addEventListener('keydown', shortCutKeys, true);
    return () => {
      dispatch(setComponentVisualizationMode(visModeRestored));
      dispatch(setDatumPlaneSelectMode(false));
      dispatch(setDatumLineSelectMode(false));
      dispatch(setForceVisibledDatums([]));
      window.removeEventListener('keydown', shortCutKeys, true);
    };
  }, [dispatch, line, otherPlane, shortCutKeys, visModeRestored]);

  useUpdateEffect(() => {
    if (
      otherPlaneObjects.find((datum) => datum.nodeID === selectedPlane) &&
      selectedPlane !== otherPlane
    ) {
      setPlane(selectedPlane);
    }
    onResetSetterMode();
  }, [selectedPlane]);

  useUpdateEffect(() => {
    if (
      lineObjects.find((datum) => datum.nodeID === selectedLine) &&
      selectedLine !== line
    ) {
      setLine(selectedLine);
    }
    onResetSetterMode();
  }, [selectedLine]);

  useUpdateEffect(() => {
    if (otherPlane !== '' && line !== '') {
      const obj: IAxisPlaneAnglePlane = new AxisPlaneAnglePlaneObject({
        name: `datum plane`,
        line,
        plane: otherPlane,
        angle
      });
      setApplyReady(obj);
    } else {
      setApplyReady(undefined);
    }
    dispatch(setForceVisibledDatums([otherPlane, line]));
  }, [otherPlane, line, angle]);

  const handleChanged = (nodeID: string, i: number) => {
    if (i === 0) {
      setLine(nodeID);
    } else {
      setPlane(nodeID);
    }
  };

  const {uitgd} = store.getState();
  const menuZIndex =
    uitgd.fullScreenZIndex + uitgd.menuZIndex + uitgd.dialogZIndex;

  return (
    <Box component="div">
      {['Select a line', 'Select a plane'].map((str, i) => (
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
            value={[line, otherPlane][i]}
            id={ids[i]}
            label={str}
            onChange={(e) => handleChanged(e.target.value, i)}
            sx={{flexGrow: '1'}}
            MenuProps={{
              sx: {zIndex: menuZIndex}
            }}
          >
            <MenuItem aria-label="None" value="">
              <em>None</em>
            </MenuItem>
            {[lineObjects, otherPlaneObjects][i].map((datum) => (
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
      <Scalar
        key="scaler"
        value={angle}
        unit="deg"
        onUpdate={() => {
          setAngle(
            new NamedNumber({
              name: 'angle',
              value: angle.getStringValue()
            })
          );
        }}
      />
    </Box>
  );
}
