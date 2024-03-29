import * as React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Dialog from '@mui/material/Dialog';
import {SavedData} from '@gd/ISaveData';
import {NamedVector3} from '@gd/NamedValues';
import store, {RootState} from '@store/store';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import PaperComponentDraggable from '@gdComponents/PaperComponentDraggable';
import FormControl from '@mui/material/FormControl';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import Vector from '@gdComponents/Vector';
import {
  setUIDisabled,
  setMeasureElementPointMode,
  setMeasureElementPointSelected,
  setDriversEyeDialogOpen
} from '@store/reducers/uiTempGeometryDesigner';
import Box from '@mui/material/Box';
import {
  setMeasureToolDialogPosition,
  setComponentVisualizationMode
} from '@store/reducers/uiGeometryDesigner';
import InputLabel from '@mui/material/InputLabel';
import useUpdateEffect from '@app/hooks/useUpdateEffect';
import {setDriversEye} from '@store/reducers/dataGeometryDesigner';

export function DriversEyeSettingDialog() {
  const dispatch = useDispatch();

  const {uitgd} = store.getState();
  const dialogZIndex = uitgd.fullScreenZIndex + uitgd.dialogZIndex;

  const [applyReady, setApplyReady] =
    React.useState<SavedData['options']['driversEye']>(undefined);

  const open = useSelector(
    (state: RootState) => state.uitgd.gdDialogState.driversEyeDialogOpen
  );
  const close = () => {
    dispatch(setDriversEyeDialogOpen({open: false}));
  };

  const handleOK = () => {
    if (!applyReady) return;
    handleApply();
    close();
  };
  const handleCancel = () => {
    close();
  };
  const handleApply = () => {
    if (!applyReady) return;
    dispatch(setDriversEye(applyReady));
    setApplyReady(undefined);
  };

  React.useEffect(() => {
    if (open) {
      dispatch(setUIDisabled(true));
    } else {
      dispatch(setUIDisabled(false));
    }
  }, [dispatch, open]);

  const collectedAssembly = useSelector(
    (state: RootState) => state.uitgd.collectedAssembly
  );

  const eyePoint = useSelector(
    (state: RootState) => state.dgd.present.options.driversEye
  );

  const [direction, setDirection] = React.useState(
    new NamedVector3({
      name: 'drivers eye direction',
      value: eyePoint?.direction ?? {x: 1, y: 0, z: 0}
    })
  );

  const [visModeRestored, setVisModeRestored] = React.useState(
    store.getState().uigd.gdSceneState.componentVisualizationMode
  );
  const id = React.useId();

  const selectedPointDefault = collectedAssembly?.children
    .find((child) => child.nodeID === eyePoint?.elementID)
    ?.getMeasurablePoints()
    .find((p) => p.nodeID === eyePoint?.pointID);

  const selectedPoint =
    useSelector(
      (state: RootState) => state.uitgd.gdSceneState.measureElementPointSelected
    ) ?? '';

  const avoidFirstRerender = React.useRef<boolean>(!!eyePoint);

  React.useEffect(() => {
    if (open) {
      setVisModeRestored(
        store.getState().uigd.gdSceneState.componentVisualizationMode
      );
      dispatch(setComponentVisualizationMode('WireFrameOnly'));
      dispatch(setMeasureElementPointMode(true));
      dispatch(setMeasureElementPointSelected(selectedPointDefault?.nodeID));
    }
    return () => {
      dispatch(setComponentVisualizationMode(visModeRestored));
      dispatch(setMeasureElementPointMode(false));
      dispatch(setMeasureElementPointSelected(undefined));
    };
  }, [dispatch, selectedPointDefault?.nodeID, visModeRestored, open]);

  useUpdateEffect(() => {
    if (avoidFirstRerender.current) {
      avoidFirstRerender.current = false;
      return;
    }
    if (selectedPoint !== '') {
      for (const child of collectedAssembly?.children ?? []) {
        for (const p of child.getMeasurablePoints()) {
          if (p.nodeID === selectedPoint) {
            const obj: SavedData['options']['driversEye'] = {
              elementID: p.parent!.nodeID,
              pointID: p.nodeID,
              direction: direction.getData()
            };
            setApplyReady(obj);
          }
        }
      }
    } else {
      setApplyReady(undefined);
    }
  }, [selectedPoint]);

  const elements = collectedAssembly?.children ?? [];

  const handleChanged = (e: SelectChangeEvent<string>) => {
    if (selectedPoint !== e.target.value) {
      dispatch(setMeasureElementPointSelected(e.target.value));
    }
  };

  return (
    <Dialog
      open={open}
      components={{Backdrop: undefined}}
      PaperComponent={(props) =>
        PaperComponentDraggable({
          ...props,
          position: (state: RootState) =>
            state.uigd.dialogState.measureToolDialogInitialPosition,
          setPosition: setMeasureToolDialogPosition
        })
      }
      aria-labelledby="draggable-dialog-title"
      sx={{
        zIndex: `${dialogZIndex}!important`,
        pointerEvents: 'none'
      }}
      PaperProps={{
        sx: {
          minWidth: 500,
          maxHeight: '70vh'
        }
      }}
      TransitionProps={{unmountOnExit: true}}
    >
      <DialogTitle sx={{marginRight: 10}}>
        Driver&apos;s Eye Point Settings
      </DialogTitle>
      <DialogContent>
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
          <Vector
            directionMode
            vector={direction}
            unit=""
            onUpdate={() => {
              setDirection(
                new NamedVector3({
                  name: direction.name,
                  value: direction.getStringValue()
                })
              );
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleApply} disabled={!applyReady}>
          Appy
        </Button>
        <Button onClick={handleOK} disabled={!applyReady}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
