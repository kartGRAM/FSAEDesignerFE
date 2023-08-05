import React from 'react';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {IPointNormalPlane} from '@gd/measure/IPlaneObjects';
import {PointNormalPlane as PointNormalPlaneObject} from '@gd/measure/PlaneObjects';
import {IDatumObject, isPoint, isLine} from '@gd/measure/IDatumObjects';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';

import {NamedVector3} from '@gd/NamedValues';
import {isNamedVector3} from '@gd/INamedValues';
import {setComponentVisualizationMode} from '@store/reducers/uiGeometryDesigner';
import {
  setDatumPointSelectMode,
  setDatumPointSelected,
  setDatumLineSelectMode,
  setDatumLineSelected
} from '@store/reducers/uiTempGeometryDesigner';
import Target from '@gdComponents/svgs/Target';
import Vector from '@gdComponents/Vector';
import useUpdateEffect from '@hooks/useUpdateEffect';

export const normalTypes = ['datum line', 'constant vector'] as const;
export type NormalType = typeof normalTypes[number];

export function PointNormalPlane(props: {
  plane?: IPointNormalPlane;
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {plane, setApplyReady} = props;
  const dispatch = useDispatch();

  const ids = [React.useId(), React.useId(), React.useId()];

  const [visModeRestored, setVisModeRestored] = React.useState(
    store.getState().uigd.present.gdSceneState.componentVisualizationMode
  );

  const [normalType, setNormalType] = React.useState<NormalType>(
    isNamedVector3(plane?.normal) ? 'constant vector' : 'datum line'
  );

  const selectMode = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumLineSelectMode
  );
  const selectedPoint = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumPointSelected
  );

  const selectedLine = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumLineSelected
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
  const defaultLine =
    (!isNamedVector3(plane?.normal) ? plane?.normal : undefined) ?? '';

  const [point, setPoint] = React.useState(defaultPoint);
  const [line, setLine] = React.useState(defaultLine);
  const [normal, setNormal] = React.useState(
    new NamedVector3({
      name: 'normal',
      value: isNamedVector3(plane?.normal)
        ? plane?.normal.getStringValue()
        : undefined
    })
  );

  const onResetSetterMode = () => {
    dispatch(setDatumPointSelected(''));
    dispatch(setDatumLineSelected(''));
    dispatch(setDatumPointSelectMode(false));
    dispatch(setDatumLineSelectMode(false));
  };

  useUpdateEffect(() => {
    if (
      lineObjects.find((datum) => datum.nodeID === selectedLine) &&
      selectedLine !== line
    ) {
      setLine(selectedLine);
    }
    onResetSetterMode();
  }, [selectedLine]);

  React.useEffect(() => {
    if (
      pointObjects.find((datum) => datum.nodeID === selectedPoint) &&
      selectedPoint !== point
    ) {
      setPoint(selectedPoint);
    }
    onResetSetterMode();
  }, [selectedPoint]);

  useUpdateEffect(() => {
    if (normalType === 'constant vector') {
      const obj: IPointNormalPlane = new PointNormalPlaneObject({
        name: `datum plane`,
        point,
        normal: normal.getStringValue()
      });
      setApplyReady(obj);
    } else if (normalType === 'datum line' && line !== '') {
      const obj: IPointNormalPlane = new PointNormalPlaneObject({
        name: `datum plane`,
        point,
        normal: line
      });
      setApplyReady(obj);
    } else {
      setApplyReady(undefined);
    }
  }, [normal, point, normalType, line]);

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
        <InputLabel htmlFor={ids[0]}>Select normal type</InputLabel>
        <Select
          disabled={selectMode}
          value={normalType}
          id={ids[0]}
          label="Select normal type"
          onChange={(e) => setNormalType(e.target.value as NormalType)}
          sx={{flexGrow: '1'}}
          MenuProps={{
            sx: {zIndex: menuZIndex}
          }}
        >
          <MenuItem aria-label="None" value="">
            <em>None</em>
          </MenuItem>
          {normalTypes.map((type) => (
            <MenuItem value={type} key={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {normalType === 'datum line' ? (
        <FormControl
          sx={{
            m: 1,
            mt: 3,
            minWidth: 250,
            display: 'flex',
            flexDirection: 'row'
          }}
        >
          <InputLabel htmlFor={ids[1]}>Select a line</InputLabel>
          <Select
            disabled={selectMode}
            value={line}
            id={ids[1]}
            label="Select a line"
            onChange={(e) => setLine(e.target.value)}
            sx={{flexGrow: '1'}}
            MenuProps={{
              sx: {zIndex: menuZIndex}
            }}
          >
            <MenuItem aria-label="None" value="">
              <em>None</em>
            </MenuItem>
            {lineObjects.map((datum) => (
              <MenuItem value={datum.nodeID} key={datum.nodeID}>
                {datum.name}
              </MenuItem>
            ))}
          </Select>
          <Target
            sx={{mt: 1}}
            title="Select a line"
            onClick={() => dispatch(setDatumLineSelectMode(true))}
            disabled={selectMode}
          />
        </FormControl>
      ) : (
        <Vector
          vector={normal}
          unit="mm"
          onUpdate={() => {
            setNormal(
              new NamedVector3({
                name: 'normal',
                value: normal.getStringValue()
              })
            );
          }}
        />
      )}
      <FormControl
        key="select a point"
        sx={{
          m: 1,
          mt: 3,
          minWidth: 250,
          display: 'flex',
          flexDirection: 'row'
        }}
      >
        <InputLabel htmlFor={ids[2]}>Select line</InputLabel>
        <Select
          disabled={selectMode}
          value={point}
          id={ids[2]}
          label="Select a point"
          onChange={(e) => setLine(e.target.value)}
          sx={{flexGrow: '1'}}
          MenuProps={{
            sx: {zIndex: menuZIndex}
          }}
        >
          <MenuItem aria-label="None" value="">
            <em>None</em>
          </MenuItem>
          {pointObjects.map((datum) => (
            <MenuItem value={datum.nodeID} key={datum.nodeID}>
              {datum.name}
            </MenuItem>
          ))}
        </Select>
        <Target
          sx={{mt: 1}}
          title="Select a Point"
          onClick={() => dispatch(setDatumPointSelectMode(true))}
          disabled={selectMode}
        />
      </FormControl>
    </Box>
  );
}
