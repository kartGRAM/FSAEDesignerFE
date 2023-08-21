import React from 'react';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {ITwoPlaneIntersectionLine} from '@gd/measure/datum/ILineObjects';
import {TwoPlaneIntersectionLine as TPILObject} from '@gd/measure/datum/LineObjects';
import {IDatumObject, isPlane} from '@gd/measure/datum/IDatumObjects';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import {
  setDatumPlaneSelectMode,
  setDatumPlaneSelected,
  setForceVisibledDatums
} from '@store/reducers/uiTempGeometryDesigner';
import MenuItem from '@mui/material/MenuItem';
import Target from '@gdComponents/svgs/Target';
import useUpdateEffect from '@hooks/useUpdateEffect';

export function TwoPlaneIntersectionLine(props: {
  line?: ITwoPlaneIntersectionLine;
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {line, setApplyReady} = props;

  const dispatch = useDispatch();
  const ids = [React.useId(), React.useId(), React.useId()];
  const [setterMode, setSetterMode] = React.useState(-1);

  const selectedPlane = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumPlaneSelected
  );

  const datumManager = useSelector(
    (state: RootState) => state.uitgd.datumManager
  );

  const datumObjectsAll = datumManager?.getObjectsAll() ?? [];

  const idx = datumObjectsAll.findIndex((d) => d.nodeID === line?.nodeID);

  const datumObjects = datumObjectsAll
    .slice(0, idx === -1 ? undefined : idx)
    .filter((datum) => isPlane(datum));

  const defaultPlanes = [line?.planes[0] ?? '', line?.planes[1] ?? ''];

  const [planes, setPlanes] = React.useState(defaultPlanes);

  const datumObjectsFiltered = planes.map((plane) => {
    const pls = planes.filter((p) => p !== plane);
    return datumObjects.filter((datum) => !pls.includes(datum.nodeID));
  });

  const handleChanged = (nodeID: string, i: number) => {
    setPlanes((prev) => {
      prev[i] = nodeID;
      return [...prev];
    });
  };

  const handleGetPoint = (mode: number) => {
    dispatch(setDatumPlaneSelectMode(true));
    setSetterMode(mode);
  };

  const onResetSetterMode = React.useCallback(() => {
    dispatch(setDatumPlaneSelected(''));
    setSetterMode(-1);
    dispatch(setDatumPlaneSelectMode(false));
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
    dispatch(setDatumPlaneSelectMode(false));
    dispatch(setForceVisibledDatums(planes));
    window.addEventListener('keydown', shortCutKeys, true);
    return () => {
      dispatch(setDatumPlaneSelectMode(false));
      dispatch(setForceVisibledDatums([]));
      window.removeEventListener('keydown', shortCutKeys, true);
    };
  }, [dispatch, planes, shortCutKeys]);

  useUpdateEffect(() => {
    if (
      setterMode !== -1 &&
      datumObjectsFiltered[setterMode].find(
        (datum) => datum.nodeID === selectedPlane
      )
    ) {
      setPlanes((prev) => {
        prev[setterMode] = selectedPlane;
        return [...prev];
      });
    }
    onResetSetterMode();
  }, [selectedPlane]);

  useUpdateEffect(() => {
    if (planes[0] !== '' && planes[1] !== '') {
      const obj: ITwoPlaneIntersectionLine = new TPILObject({
        name: `datum line`,
        planes: [planes[0], planes[1]]
      });
      setApplyReady(obj);
    } else {
      setApplyReady(undefined);
    }
    dispatch(setForceVisibledDatums(planes));
  }, [...planes]);

  const {uitgd} = store.getState();
  const menuZIndex =
    uitgd.fullScreenZIndex + uitgd.menuZIndex + uitgd.dialogZIndex;

  return (
    <Box component="div">
      {['Select first plane', 'Select second plane'].map((str, i) => (
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
            value={planes[i]}
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
      ))}
    </Box>
  );
}
