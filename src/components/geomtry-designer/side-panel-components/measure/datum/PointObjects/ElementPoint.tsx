import React from 'react';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {IElementPoint} from '@gd/measure/datum/IPointObjects';
import {ElementPoint as ElementPointObject} from '@gd/measure/datum/PointObjects';
import {IDatumObject} from '@gd/measure/datum/IDatumObjects';
import Box from '@mui/material/Box';
import {setComponentVisualizationMode} from '@store/reducers/uiGeometryDesigner';
import {
  setMeasureElementPointMode,
  setMeasureElementPointSelected
} from '@store/reducers/uiTempGeometryDesigner';
import FormControl from '@mui/material/FormControl';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import useUpdateEffect from '@app/hooks/useUpdateEffect';

export function ElementPoint(props: {
  elementPoint?: IElementPoint;
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {elementPoint, setApplyReady} = props;
  const collectedAssembly = useSelector(
    (state: RootState) => state.uitgd.collectedAssembly
  );
  const avoidFirstRerender = React.useRef<boolean>(!!elementPoint);

  const dispatch = useDispatch();
  const [visModeRestored, setVisModeRestored] = React.useState(
    store.getState().uigd.present.gdSceneState.componentVisualizationMode
  );
  const id = React.useId();

  const selectedPointDefault = collectedAssembly?.children
    .find((child) => child.nodeID === elementPoint?.element)
    ?.getMeasurablePoints()
    .find((p) => p.nodeID === elementPoint?.point);

  const selectedPoint =
    useSelector(
      (state: RootState) => state.uitgd.gdSceneState.measureElementPointSelected
    ) ?? '';

  React.useEffect(() => {
    setVisModeRestored(
      store.getState().uigd.present.gdSceneState.componentVisualizationMode
    );
    dispatch(setComponentVisualizationMode('WireFrameOnly'));
    dispatch(setMeasureElementPointMode(true));
    dispatch(setMeasureElementPointSelected(selectedPointDefault?.nodeID));
    return () => {
      dispatch(setComponentVisualizationMode(visModeRestored));
      dispatch(setMeasureElementPointMode(false));
      dispatch(setMeasureElementPointSelected(undefined));
    };
  }, []);

  const elements = collectedAssembly?.children ?? [];

  const handleChanged = (e: SelectChangeEvent<string>) => {
    if (selectedPoint !== e.target.value) {
      dispatch(setMeasureElementPointSelected(e.target.value));
    }
  };

  useUpdateEffect(() => {
    if (avoidFirstRerender.current) {
      avoidFirstRerender.current = false;
      return;
    }
    if (selectedPoint !== '') {
      for (const child of collectedAssembly?.children ?? []) {
        for (const p of child.getMeasurablePoints()) {
          if (p.nodeID === selectedPoint) {
            const obj: IElementPoint = new ElementPointObject({
              name: `datum point ${p.name}`,
              element: p.parent!.nodeID,
              point: p.nodeID
            });
            setApplyReady(obj);
          }
        }
      }
    } else {
      setApplyReady(undefined);
    }
  }, [selectedPoint]);

  return (
    <Box component="div">
      <FormControl sx={{m: 1, minWidth: 200}}>
        <InputLabel htmlFor={id}>Select a point</InputLabel>
        <Select
          native
          id={id}
          value={selectedPoint}
          label="Select a point"
          onChange={handleChanged}
        >
          <option aria-label="None" value="" />
          {elements.map((element) => (
            <optgroup label={element.name.value} key={element.nodeID}>
              {element.getMeasurablePoints().map((point) => (
                <option value={point.nodeID} key={point.nodeID}>
                  {point.name}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
