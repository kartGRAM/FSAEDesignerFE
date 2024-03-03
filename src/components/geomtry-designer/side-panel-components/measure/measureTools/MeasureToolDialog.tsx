/* eslint-disable no-nested-ternary */
import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Dialog from '@mui/material/Dialog';
import {useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import PaperComponentDraggable from '@gdComponents/PaperComponentDraggable';
import {
  IMeasureTool,
  isPosition,
  isAngle,
  isDistance,
  isMovingElementCurrentPosition
} from '@gd/measure/measureTools/IMeasureTools';
import FormControl from '@mui/material/FormControl';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import OutlinedInput from '@mui/material/OutlinedInput';
import MenuItem from '@mui/material/MenuItem';
import {setUIDisabled} from '@store/reducers/uiTempGeometryDesigner';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import {setMeasureToolDialogPosition} from '@store/reducers/uiGeometryDesigner';
import EditableTypography from '@gdComponents/EditableTypography';
import * as Yup from 'yup';
import useUpdate from '@hooks/useUpdate';
import {Position} from './MeasureTools/Position';
import {Distance} from './MeasureTools/Distance';
import {Angle} from './MeasureTools/Angle';
import {MovingElementCurrentPosition} from './MeasureTools/MovingElementCurrentPosition';

const measureToolClasses = [
  'Distance',
  'Angle',
  'Position',
  'Moving Component Current Position'
] as const;
type MeasureToolClasses = typeof measureToolClasses[number];

export function MeasureToolDialog(props: {
  open: boolean;
  close: () => void;
  apply: (tool: IMeasureTool) => void;
  tool?: IMeasureTool;
}) {
  const {open, close, apply} = props;
  let {tool} = props;

  const dispatch = useDispatch();
  const update = useUpdate();

  const {uitgd} = store.getState();
  const dialogZIndex = uitgd.fullScreenZIndex + uitgd.dialogZIndex;
  const menuZIndex =
    uitgd.fullScreenZIndex + uitgd.dialogZIndex + uitgd.menuZIndex;

  const [applyReady, setApplyReady] = React.useState<IMeasureTool | undefined>(
    undefined
  );
  if (applyReady) tool = applyReady;

  const nameDefault = 'New Measure Tool';
  const [nameBuffer, setNameBuffer] = React.useState(
    tool ? tool.name : nameDefault
  );

  const [measureToolClass, setMeasureToolClass] = React.useState<
    MeasureToolClasses | ''
  >(getMeasureToolClass(tool));

  const handleDatumClassChange = (
    event: SelectChangeEvent<MeasureToolClasses | ''>
  ) => {
    const {
      target: {value}
    } = event;
    setMeasureToolClass(value as MeasureToolClasses | '');
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
    if (nameBuffer !== nameDefault) applyReady.name = nameBuffer;
    apply(applyReady);
  };

  React.useEffect(() => {
    if (open) {
      dispatch(setUIDisabled(true));
    } else {
      dispatch(setUIDisabled(false));
    }
  }, [dispatch, open]);

  let content = null;
  if (measureToolClass === 'Position') {
    content = (
      <Position
        position={isPosition(tool) ? tool : undefined}
        setApplyReady={setApplyReady}
      />
    );
  } else if (measureToolClass === 'Distance') {
    content = (
      <Distance
        distance={isDistance(tool) ? tool : undefined}
        setApplyReady={setApplyReady}
      />
    );
  } else if (measureToolClass === 'Angle') {
    content = (
      <Angle
        angle={isAngle(tool) ? tool : undefined}
        setApplyReady={setApplyReady}
      />
    );
  } else if (measureToolClass === 'Moving Component Current Position') {
    content = (
      <MovingElementCurrentPosition
        tool={isMovingElementCurrentPosition(tool) ? tool : undefined}
        setApplyReady={setApplyReady}
      />
    );
  }

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
    >
      <EditableTypography
        typography={
          <DialogTitle sx={{marginRight: 10}}>{nameBuffer}</DialogTitle>
        }
        initialValue={nameBuffer}
        validation={Yup.string().required('required')}
        onSubmit={(value) => {
          setNameBuffer(value);
          if (tool && tool.name !== value) {
            update();
            setApplyReady(tool);
          }
        }}
      />
      <DialogContent>
        <Box
          component="div"
          sx={{m: 1, flexGrow: 1, mt: 1, flexDirection: 'row'}}
        >
          <FormControl size="small">
            <Select
              displayEmpty
              value={measureToolClass}
              onChange={handleDatumClassChange}
              sx={{
                ml: 0,
                '& legend': {display: 'none'},
                '& fieldset': {top: 0},
                width: 200
              }}
              input={<OutlinedInput />}
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return <em>Select a tool type</em>;
                }
                return selected;
              }}
              MenuProps={{
                sx: {zIndex: menuZIndex}
              }}
            >
              <MenuItem disabled value="">
                <em>Select a tool type</em>
              </MenuItem>
              {measureToolClasses.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Divider sx={{mb: 2}} />
        {content}
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

function getMeasureToolClass(tool?: IMeasureTool): MeasureToolClasses | '' {
  if (isPosition(tool)) {
    return 'Position';
  }
  if (isAngle(tool)) {
    return 'Angle';
  }
  if (isDistance(tool)) {
    return 'Distance';
  }
  if (isMovingElementCurrentPosition(tool)) {
    return 'Moving Component Current Position';
  }
  return '';
}
