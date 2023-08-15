import React from 'react';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {IThreePointsPlane} from '@gd/measure/datum/IPlaneObjects';
import {ThreePointsPlane as ThreePointsPlaneObject} from '@gd/measure/datum/PlaneObjects';
import {IDatumObject, isPoint} from '@gd/measure/datum/IDatumObjects';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import {setComponentVisualizationMode} from '@store/reducers/uiGeometryDesigner';
import {
  setDatumPointSelectMode,
  setDatumPointSelected,
  setForceVisibledDatums
} from '@store/reducers/uiTempGeometryDesigner';
import MenuItem from '@mui/material/MenuItem';
import Target from '@gdComponents/svgs/Target';
import useUpdateEffect from '@hooks/useUpdateEffect';

export function ThreePointsPlane(props: {
  threePointsPlane?: IThreePointsPlane;
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {threePointsPlane, setApplyReady} = props;

  const dispatch = useDispatch();
  const ids = [React.useId(), React.useId(), React.useId()];
  const [visModeRestored, setVisModeRestored] = React.useState(
    store.getState().uigd.present.gdSceneState.componentVisualizationMode
  );
  const [setterMode, setSetterMode] = React.useState(-1);

  const selectedPoint = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumPointSelected
  );

  const datumManager = useSelector(
    (state: RootState) => state.uitgd.datumManager
  );

  const datumObjectsAll = datumManager?.getObjectsAll() ?? [];

  const idx = datumObjectsAll.findIndex(
    (d) => d.nodeID === threePointsPlane?.nodeID
  );

  const datumObjects = datumObjectsAll
    .slice(0, idx === -1 ? undefined : idx)
    .filter((datum) => isPoint(datum));

  const defaultPoints = [
    threePointsPlane?.points[0] ?? '',
    threePointsPlane?.points[1] ?? '',
    threePointsPlane?.points[2] ?? ''
  ];

  const [points, setPoints] = React.useState(defaultPoints);

  const datumObjectsFiltered = points.map((point) => {
    const pts = points.filter((p) => p !== point);
    return datumObjects.filter((datum) => !pts.includes(datum.nodeID));
  });

  const handleChanged = (nodeID: string, i: number) => {
    setPoints((prev) => {
      prev[i] = nodeID;
      return [...prev];
    });
  };

  const handleGetPoint = (mode: number) => {
    dispatch(setDatumPointSelectMode(true));
    setSetterMode(mode);
  };

  const onResetSetterMode = () => {
    dispatch(setDatumPointSelected(''));
    setSetterMode(-1);
    dispatch(setDatumPointSelectMode(false));
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
    dispatch(setComponentVisualizationMode('WireFrameOnly'));

    window.addEventListener('keydown', shortCutKeys, true);
    return () => {
      dispatch(setComponentVisualizationMode(visModeRestored));
      dispatch(setDatumPointSelectMode(false));
      window.removeEventListener('keydown', shortCutKeys, true);
    };
  }, []);

  React.useEffect(() => {
    if (
      setterMode !== -1 &&
      datumObjectsFiltered[setterMode].find(
        (datum) => datum.nodeID === selectedPoint
      )
    ) {
      setPoints((prev) => {
        prev[setterMode] = selectedPoint;
        return [...prev];
      });
    }
    onResetSetterMode();
  }, [selectedPoint]);

  useUpdateEffect(() => {
    if (points[0] !== '' && points[1] !== '' && points[2] !== '') {
      const obj: IThreePointsPlane = new ThreePointsPlaneObject({
        name: `datum plane`,
        points: [points[0], points[1], points[2]]
      });
      setApplyReady(obj);
    } else {
      setApplyReady(undefined);
    }
    dispatch(setForceVisibledDatums(points));
    return () => {
      dispatch(setForceVisibledDatums([]));
    };
  }, [...points]);

  const {uitgd} = store.getState();
  const menuZIndex =
    uitgd.fullScreenZIndex + uitgd.menuZIndex + uitgd.dialogZIndex;

  return (
    <Box component="div">
      {['Select first point', 'Select second point', 'Select third point'].map(
        (str, i) => (
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
              disabled={setterMode !== -1}
              value={points[i]}
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
              {datumObjectsFiltered[i].map((datum) => (
                <MenuItem value={datum.nodeID} key={datum.nodeID}>
                  {datum.name}
                </MenuItem>
              ))}
            </Select>
            <Target
              sx={{mt: 1}}
              title={str}
              onClick={() => handleGetPoint(i)}
              disabled={setterMode !== -1}
            />
          </FormControl>
        )
      )}
    </Box>
  );
}
