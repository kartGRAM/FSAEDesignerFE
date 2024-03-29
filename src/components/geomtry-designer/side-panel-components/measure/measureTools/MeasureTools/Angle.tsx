import React from 'react';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {IAngle, IMeasureTool} from '@gd/measure/measureTools/IMeasureTools';
import {Angle as Tool} from '@gd/measure/measureTools/MeasureTools';
import {isLine, ILine, isPlane, IPlane} from '@gd/measure/datum/IDatumObjects';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import {
  setDatumLineSelectMode,
  setDatumLineSelected,
  setDatumPlaneSelectMode,
  setDatumPlaneSelected,
  setForceVisibledDatums
} from '@store/reducers/uiTempGeometryDesigner';
import MenuItem from '@mui/material/MenuItem';
import Target from '@gdComponents/svgs/Target';
import ListSubheader from '@mui/material/ListSubheader';
import useUpdateEffect from '@hooks/useUpdateEffect';

export function Angle(props: {
  angle?: IAngle;
  setApplyReady: React.Dispatch<React.SetStateAction<IMeasureTool | undefined>>;
}) {
  const {setApplyReady} = props;
  // eslint-disable-next-line react/destructuring-assignment
  const angle = props.angle?.clone();

  const dispatch = useDispatch();
  const ids = [React.useId(), React.useId()];

  const selectedLine = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumLineSelected
  );

  const selectedPlane = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.datumPlaneSelected
  );

  const selectMode = useSelector(
    (state: RootState) =>
      state.uitgd.gdSceneState.datumPointSelectMode ||
      state.uitgd.gdSceneState.datumLineSelectMode ||
      state.uitgd.gdSceneState.datumPlaneSelectMode
  );

  const datumManager = useSelector(
    (state: RootState) => state.uitgd.datumManager
  );

  const datumObjectsAll = datumManager?.getObjectsAll() ?? [];

  const lineObjects = datumObjectsAll.filter((datum) =>
    isLine(datum)
  ) as ILine[];

  const planeObjects = datumObjectsAll.filter((datum) =>
    isPlane(datum)
  ) as IPlane[];

  const selectedLineInstance = lineObjects.find(
    (datum) => datum.nodeID === selectedLine
  );

  const selectedPlaneInstance = planeObjects.find(
    (datum) => datum.nodeID === selectedPlane
  );

  const defaultLhs = angle?.lhs ?? undefined;
  const defaultRhs = angle?.rhs ?? undefined;

  const [lhs, setLhs] = React.useState(defaultLhs);
  const [rhs, setRhs] = React.useState(defaultRhs);
  const [setterMode, setSetterMode] = React.useState<'Lhs' | 'Rhs' | ''>('');

  const handleGetDatum = (i: number) => {
    dispatch(setDatumLineSelectMode(true));
    dispatch(setDatumPlaneSelectMode(true));
    if (i === 0) setSetterMode('Lhs');
    if (i === 1) setSetterMode('Rhs');
  };

  const onResetSetterMode = React.useCallback(() => {
    setSetterMode('');
    dispatch(setDatumLineSelected(''));
    dispatch(setDatumLineSelectMode(false));
    dispatch(setDatumPlaneSelected(''));
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
    dispatch(setDatumLineSelectMode(false));
    dispatch(setDatumPlaneSelectMode(false));
    dispatch(setForceVisibledDatums([lhs?.nodeID ?? '', rhs?.nodeID ?? '']));
    window.addEventListener('keydown', shortCutKeys, true);
    return () => {
      dispatch(setDatumLineSelectMode(false));
      dispatch(setDatumPlaneSelectMode(false));
      dispatch(setForceVisibledDatums([]));
      window.removeEventListener('keydown', shortCutKeys, true);
    };
  }, [dispatch, lhs?.nodeID, rhs?.nodeID, shortCutKeys]);

  useUpdateEffect(() => {
    if (setterMode === '') return;
    const setValue = setterMode === 'Lhs' ? setLhs : setRhs;
    if (selectedLineInstance) {
      setValue(selectedLineInstance);
    } else if (selectedPlaneInstance) {
      setValue(selectedPlaneInstance);
    }
    onResetSetterMode();
  }, [selectedLineInstance, selectedPlaneInstance]);

  useUpdateEffect(() => {
    if (lhs && rhs && datumManager) {
      const obj: IAngle = new Tool(
        {
          name: `angle`,
          lhs,
          rhs
        },
        datumManager
      );
      setApplyReady(obj);
    } else {
      setApplyReady(undefined);
    }
    dispatch(setForceVisibledDatums([lhs?.nodeID ?? '', rhs?.nodeID ?? '']));
  }, [lhs, rhs]);

  const handleChanged = (nodeID: string, i: number) => {
    if (i === 0) {
      setLhs(
        datumObjectsAll.find((datum) => datum.nodeID === nodeID) as
          | ILine
          | IPlane
          | undefined
      );
    }
    if (i === 1) {
      setRhs(
        datumObjectsAll.find((datum) => datum.nodeID === nodeID) as
          | ILine
          | IPlane
          | undefined
      );
    }
  };

  const {uitgd} = store.getState();
  const menuZIndex =
    uitgd.fullScreenZIndex + uitgd.menuZIndex + uitgd.dialogZIndex;

  return (
    <Box component="div">
      {['Select a datum object', 'Select another datum object'].map(
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
              disabled={selectMode}
              value={[lhs, rhs][i]?.nodeID ?? ''}
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
              {['datum lines', 'datum planes'].map((group, j) => [
                <ListSubheader>{group}</ListSubheader>,
                [lineObjects, planeObjects][j].map((datum) => (
                  <MenuItem value={datum.nodeID} key={datum.nodeID}>
                    {datum.name}
                  </MenuItem>
                ))
              ])}
            </Select>
            <Target
              sx={{mt: 1}}
              title={str}
              onClick={() => handleGetDatum(i)}
              disabled={selectMode}
            />
          </FormControl>
        )
      )}
    </Box>
  );
}
