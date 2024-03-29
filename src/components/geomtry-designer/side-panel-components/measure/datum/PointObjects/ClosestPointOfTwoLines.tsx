import React from 'react';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {IClosestPointOfTwoLines} from '@gd/measure/datum/IPointObjects';
import {ClosestPointOfTwoLines as PointObject} from '@gd/measure/datum/PointObjects';
import {IDatumObject, isLine} from '@gd/measure/datum/IDatumObjects';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import {
  setDatumLineSelectMode,
  setDatumLineSelected,
  setForceVisibledDatums
} from '@store/reducers/uiTempGeometryDesigner';
import MenuItem from '@mui/material/MenuItem';
import Target from '@gdComponents/svgs/Target';
import Scalar from '@gdComponents/Scalar';
import {NamedNumber} from '@gd/NamedValues';
import useUpdateEffect from '@hooks/useUpdateEffect';

export function ClosestPointOfTwoLines(props: {
  point?: IClosestPointOfTwoLines;
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {point, setApplyReady} = props;

  const dispatch = useDispatch();
  const ids = [React.useId(), React.useId(), React.useId()];

  const [weight, setWeight] = React.useState(
    new NamedNumber({
      name: 'weight',
      value: point?.weight.getStringValue() ?? 0
    })
  );

  const [setterMode, setSetterMode] = React.useState(-1);

  const selectedLine = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumLineSelected
  );

  const datumManager = useSelector(
    (state: RootState) => state.uitgd.datumManager
  );

  const datumObjectsAll = datumManager?.getObjectsAll() ?? [];

  const idx = datumObjectsAll.findIndex((d) => d.nodeID === point?.nodeID);

  const datumObjects = datumObjectsAll
    .slice(0, idx === -1 ? undefined : idx)
    .filter((datum) => isLine(datum));

  const defaultLines = [point?.lines[0] ?? '', point?.lines[1] ?? ''];

  const [lines, setLines] = React.useState(defaultLines);

  const datumObjectsFiltered = lines.map((line) => {
    const pls = lines.filter((p) => p !== line);
    return datumObjects.filter((datum) => !pls.includes(datum.nodeID));
  });

  const handleChanged = (nodeID: string, i: number) => {
    setLines((prev) => {
      prev[i] = nodeID;
      return [...prev];
    });
  };

  const handleGetPoint = (mode: number) => {
    dispatch(setDatumLineSelectMode(true));
    setSetterMode(mode);
  };

  const onResetSetterMode = React.useCallback(() => {
    dispatch(setDatumLineSelected(''));
    setSetterMode(-1);
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
    dispatch(setDatumLineSelectMode(false));
    dispatch(setForceVisibledDatums(lines));
    window.addEventListener('keydown', shortCutKeys, true);
    return () => {
      dispatch(setDatumLineSelectMode(false));
      dispatch(setForceVisibledDatums([]));
      window.removeEventListener('keydown', shortCutKeys, true);
    };
  }, [dispatch, lines, shortCutKeys]);

  useUpdateEffect(() => {
    if (
      setterMode !== -1 &&
      datumObjectsFiltered[setterMode].find(
        (datum) => datum.nodeID === selectedLine
      )
    ) {
      setLines((prev) => {
        prev[setterMode] = selectedLine;
        return [...prev];
      });
    }
    onResetSetterMode();
  }, [selectedLine]);

  useUpdateEffect(() => {
    if (lines[0] !== '' && lines[1] !== '') {
      const obj: IClosestPointOfTwoLines = new PointObject({
        name: `datum point`,
        lines: [lines[0], lines[1]],
        weight
      });
      setApplyReady(obj);
    } else {
      setApplyReady(undefined);
    }
    dispatch(setForceVisibledDatums(lines));
  }, [...lines, weight]);

  const {uitgd} = store.getState();
  const menuZIndex =
    uitgd.fullScreenZIndex + uitgd.menuZIndex + uitgd.dialogZIndex;

  return (
    <Box component="div">
      {['Select first line', 'Select second line'].map((str, i) => (
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
            value={lines[i]}
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
      <Scalar
        value={weight}
        unit=""
        onUpdate={() => {
          setWeight(
            new NamedNumber({
              name: 'weight',
              value: weight.getStringValue()
            })
          );
        }}
      />
    </Box>
  );
}
