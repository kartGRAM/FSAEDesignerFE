import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {IPointDirectionLine} from '@gd/measure/ILineObjects';
import {PointDirectionLine as PointDirectionLineObject} from '@gd/measure/LineObjects';
import {IDatumObject, isLine, isPoint} from '@gd/measure/IDatumObjects';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import store, {RootState} from '@store/store';
import {NamedVector3} from '@gd/NamedValues';
import {isNamedVector3} from '@gd/INamedValues';
import {
  setDatumPointSelectMode,
  setDatumPointSelected,
  setDatumLineSelectMode,
  setDatumLineSelected,
  setSelectedPoint
} from '@store/reducers/uiTempGeometryDesigner';
import {setComponentVisualizationMode} from '@store/reducers/uiGeometryDesigner';
import Target from '@gdComponents/svgs/Target';
import Vector from '@gdComponents/Vector';

export const directionTypes = ['datum line', 'constant vector'] as const;
export type DirectionType = typeof directionTypes[number];

export const pointTypes = ['datum point', 'constant vector'] as const;
export type PointType = typeof pointTypes[number];

export function PointDirectionLine(props: {
  line?: IPointDirectionLine;
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {line, setApplyReady} = props;
  const dispatch = useDispatch();

  const [visModeRestored, setVisModeRestored] = React.useState(
    store.getState().uigd.present.gdSceneState.componentVisualizationMode
  );

  const ids = [React.useId(), React.useId(), React.useId(), React.useId()];

  const [pointType, setPointType] = React.useState<string>(
    isNamedVector3(line?.point) ? 'constant vector' : 'datum point'
  );

  const [directionType, setDirectionType] = React.useState<string>(
    isNamedVector3(line?.direction) ? 'constant vector' : 'datum line'
  );

  const selectMode = useSelector(
    (state: RootState) =>
      state.uitgd.gdSceneState.datumLineSelectMode ||
      state.uitgd.gdSceneState.datumPointSelectMode
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

  const idx = datumObjectsAll.findIndex((d) => d.nodeID === line?.nodeID);

  const lineObjects = datumObjectsAll
    .slice(0, idx === -1 ? undefined : idx)
    .filter((datum) => isLine(datum));

  const pointObjects = datumObjectsAll
    .slice(0, idx === -1 ? undefined : idx)
    .filter((datum) => isPoint(datum));

  const defaultPoint =
    (!isNamedVector3(line?.direction) ? line?.direction : undefined) ?? '';

  const defaultDirection =
    (!isNamedVector3(line?.direction) ? line?.direction : undefined) ?? '';

  const [nPoint, setNPoint] = React.useState(defaultPoint);
  const [vPoint, setVPoint] = React.useState(
    new NamedVector3({
      name: 'point',
      value: isNamedVector3(line?.point)
        ? line?.point.getStringValue()
        : undefined
    })
  );

  const [nDirection, setNDirection] = React.useState(defaultDirection);
  const [vDirection, setVDirection] = React.useState(
    new NamedVector3({
      name: 'direction',
      value: isNamedVector3(line?.direction)
        ? line?.direction.getStringValue()
        : undefined
    })
  );

  const onResetSetterMode = () => {
    dispatch(setDatumPointSelected(''));
    dispatch(setDatumPointSelectMode(false));
    dispatch(setDatumLineSelected(''));
    dispatch(setDatumLineSelectMode(false));
  };

  React.useEffect(() => {
    if (
      pointObjects.find((datum) => datum.nodeID === selectedPoint) &&
      selectedLine !== nDirection
    ) {
      setNPoint(selectedPoint);
    }
    onResetSetterMode();
  }, [selectedPoint]);

  React.useEffect(() => {
    if (
      lineObjects.find((datum) => datum.nodeID === selectedLine) &&
      selectedLine !== nDirection
    ) {
      setNDirection(selectedLine);
    }
    onResetSetterMode();
  }, [selectedLine]);

  React.useEffect(() => {
    if (
      ((directionType === 'datum line' && nDirection !== '') ||
        directionType === 'constant vector') &&
      ((pointType === 'datum point' && nPoint !== '') ||
        pointType === 'constant vector')
    ) {
      const obj: IPointDirectionLine = new PointDirectionLineObject({
        name: `datum line`,
        point: pointType === 'datum point' ? nPoint : vPoint.getStringValue(),
        direction:
          directionType === 'datum line'
            ? nDirection
            : vDirection.getStringValue()
      });
      setApplyReady(obj);
    } else {
      setApplyReady(undefined);
    }
  }, [vDirection, nDirection, directionType, vPoint, nPoint, pointType, line]);

  const shortCutKeys = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onResetSetterMode();
    }
  };

  React.useEffect(() => {
    setVisModeRestored(
      store.getState().uigd.present.gdSceneState.componentVisualizationMode
    );
    dispatch(setSelectedPoint(null));
    dispatch(setDatumLineSelectMode(false));
    dispatch(setDatumPointSelectMode(false));
    dispatch(setComponentVisualizationMode('WireFrameOnly'));
    window.addEventListener('keydown', shortCutKeys, true);
    return () => {
      dispatch(setSelectedPoint(null));
      dispatch(setComponentVisualizationMode(visModeRestored));
      dispatch(setDatumLineSelectMode(false));
      dispatch(setDatumPointSelectMode(false));
      window.removeEventListener('keydown', shortCutKeys, true);
    };
  }, []);

  return (
    <Box component="div">
      {[
        {name: 'point', select: 'Select a point'},
        {name: 'direction', select: 'Select a line'}
      ].map((value, i) => (
        <>
          <FormControl
            sx={{
              m: 1,
              mt: 3,
              minWidth: 250,
              display: 'flex',
              flexDirection: 'row'
            }}
          >
            <InputLabel
              htmlFor={ids[i]}
            >{`Select ${value.name} type`}</InputLabel>
            <Select
              disabled={selectMode}
              value={[pointType, directionType][i]}
              id={ids[i]}
              label={`Select ${value.name} type`}
              onChange={(e) =>
                [setPointType, setDirectionType][i](e.target.value)
              }
              sx={{flexGrow: '1'}}
              MenuProps={{
                sx: {zIndex: 150000000000}
              }}
            >
              <MenuItem aria-label="None" value="">
                <em>None</em>
              </MenuItem>
              {[pointTypes, directionTypes][i].map((type) => (
                <MenuItem value={type} key={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {[pointType === 'datum point', directionType === 'datum line'][i] ? (
            <FormControl
              sx={{
                m: 1,
                mt: 3,
                minWidth: 250,
                display: 'flex',
                flexDirection: 'row'
              }}
            >
              <InputLabel htmlFor={ids[i + 1]}>{value.select}</InputLabel>
              <Select
                disabled={selectMode}
                value={[nPoint, nDirection][i]}
                id={ids[i + 1]}
                label={value.select}
                onChange={(e) => [setNPoint, setNDirection][i](e.target.value)}
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
                title={value.select}
                onClick={() =>
                  dispatch(
                    [setDatumPointSelectMode, setDatumLineSelectMode][i](true)
                  )
                }
                disabled={selectMode}
              />
            </FormControl>
          ) : (
            <Vector
              vector={[vPoint, vDirection][i]}
              unit="mm"
              onUpdate={() => {
                [setVPoint, setVDirection][i](
                  new NamedVector3({
                    name: value.name,
                    value: [vPoint, vDirection][i].getStringValue()
                  })
                );
              }}
            />
          )}
        </>
      ))}
    </Box>
  );
}
