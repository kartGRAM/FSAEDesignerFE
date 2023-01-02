/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {ITwoPointsLine} from '@gd/measure/ILineObjects';
import {TwoPointsLine as LineObject} from '@gd/measure/LineObjects';
import {IDatumObject, isPoint} from '@gd/measure/IDatumObjects';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import {
  setDatumPointSelectMode,
  setDatumPointSelected,
  setForceVisibledDatums
} from '@store/reducers/uiTempGeometryDesigner';
import MenuItem from '@mui/material/MenuItem';
import Target from '@gdComponents/svgs/Target';

export function TwoLinesPoint(props: {
  line?: ITwoPointsLine;
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {line, setApplyReady} = props;

  const dispatch = useDispatch();
  const ids = [React.useId(), React.useId(), React.useId()];

  const [setterMode, setSetterMode] = React.useState(-1);

  const selectedPoint = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumPointSelected
  );

  const datumManager = useSelector(
    (state: RootState) => state.uitgd.datumManager
  );

  const datumObjectsAll = datumManager?.getObjectsAll() ?? [];

  const idx = datumObjectsAll.findIndex((d) => d.nodeID === line?.nodeID);

  const datumObjects = datumObjectsAll
    .slice(0, idx === -1 ? undefined : idx)
    .filter((datum) => isPoint(datum));

  const defaultPoints = [line?.points[0] ?? '', line?.points[1] ?? ''];

  const [points, setPoints] = React.useState(defaultPoints);

  const datumObjectsFiltered = points.map((point) => {
    const pls = points.filter((p) => p !== point);
    return datumObjects.filter((datum) => !pls.includes(datum.nodeID));
  });

  const handleChanged = (nodeID: string, i: number) => {
    setPoints((prev) => {
      prev[i] = nodeID;
      return [...prev];
    });
  };

  const handleGetLine = (mode: number) => {
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
    dispatch(setDatumPointSelectMode(false));
    window.addEventListener('keydown', shortCutKeys, true);
    return () => {
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

  React.useEffect(() => {
    if (points[0] !== '' && points[1] !== '') {
      const obj: ITwoPointsLine = new LineObject({
        name: `datum line`,
        points: [points[0], points[1]]
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

  return (
    <Box component="div">
      {['Select first point', 'Select second point'].map((str, i) => (
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
              sx: {zIndex: 150000000000}
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
            title={str}
            onClick={() => handleGetLine(i)}
            disabled={setterMode !== -1}
          />
        </FormControl>
      ))}
    </Box>
  );
}
