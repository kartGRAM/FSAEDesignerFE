/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {IPosition, IMeasureTool} from '@gd/measure/IMeasureTools';
import {Position as Tool} from '@gd/measure/MeasureTools';
import {isPoint, IPoint} from '@gd/measure/IDatumObjects';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
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

export function Position(props: {
  position?: IPosition;
  setApplyReady: React.Dispatch<React.SetStateAction<IMeasureTool | undefined>>;
}) {
  const {position, setApplyReady} = props;

  const dispatch = useDispatch();
  const ids = [React.useId()];

  const selectedPoint = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumPointSelected
  );

  const selectMode = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumPointSelectMode
  );

  const datumManager = useSelector(
    (state: RootState) => state.uitgd.datumManager
  );

  const datumObjectsAll = datumManager?.getObjectsAll() ?? [];

  const pointObjects = datumObjectsAll.filter((datum) =>
    isPoint(datum)
  ) as IPoint[];

  const selectedPointInstance = pointObjects.find(
    (datum) => datum.nodeID === selectedPoint
  );

  const defaultPoint = position?.point ?? undefined;

  const [point, setPoint] = React.useState(defaultPoint);

  const handleGetDatum = (i: number) => {
    if (i === 0) {
      dispatch(setDatumPointSelectMode(true));
    }
  };

  const onResetSetterMode = () => {
    dispatch(setDatumPointSelected(''));
    dispatch(setDatumPointSelectMode(false));
  };

  const shortCutKeys = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onResetSetterMode();
    }
  };

  React.useEffect(() => {
    dispatch(setDatumPointSelectMode(false));
    window.addEventListener('keydown', shortCutKeys, true);
    return () => {
      dispatch(setDatumPointSelectMode(false));
      window.removeEventListener('keydown', shortCutKeys, true);
    };
  }, []);

  React.useEffect(() => {
    if (selectedPointInstance) {
      setPoint(selectedPointInstance);
    }
    onResetSetterMode();
  }, [selectedPointInstance]);

  React.useEffect(() => {
    if (point && datumManager) {
      const obj: IPosition = new Tool(
        {
          name: `position`,
          point
        },
        datumManager
      );
      setApplyReady(obj);
    } else {
      setApplyReady(undefined);
    }
    dispatch(setForceVisibledDatums([point?.nodeID ?? '']));
    return () => {
      dispatch(setForceVisibledDatums([]));
    };
  }, [point]);

  const handleChanged = (nodeID: string, i: number) => {
    if (i === 0) {
      setPoint(pointObjects.find((point) => point.nodeID === nodeID));
    }
  };

  const menuZIndex = useSelector(
    (state: RootState) =>
      state.uitgd.fullScreenZIndex +
      state.uitgd.menuZIndex +
      state.uitgd.dialogZIndex
  );

  return (
    <Box component="div">
      {['Select a datum point'].map((str, i) => (
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
            value={point?.nodeID ?? ''}
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
            {[pointObjects][i].map((datum) => (
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
