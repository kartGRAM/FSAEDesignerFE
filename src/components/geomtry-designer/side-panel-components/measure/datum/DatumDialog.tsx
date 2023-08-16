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
  IDatumObject,
  isPlane,
  isPoint,
  isLine
} from '@gd/measure/datum/IDatumObjects';
import FormControl from '@mui/material/FormControl';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import OutlinedInput from '@mui/material/OutlinedInput';
import MenuItem from '@mui/material/MenuItem';
import {setUIDisabled} from '@store/reducers/uiTempGeometryDesigner';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import {setDatumDialogPosition} from '@store/reducers/uiGeometryDesigner';
import EditableTypography from '@gdComponents/EditableTypography';
import * as Yup from 'yup';
import {
  getPointObjectClass,
  PointObject,
  PointClasses,
  pointClasses
} from './PointObjects/PointObject';
import {
  getPlaneObjectClass,
  PlaneObject,
  PlaneClasses,
  planeClasses
} from './PlaneObjects/PlaneObject';
import {
  getLineObjectClass,
  LineObject,
  LineClasses,
  lineClasses
} from './LineObjects/LineObject';

const datumTypes = ['Plane', 'Line', 'Point'] as const;
type DatumTypes = typeof datumTypes[number];

type DatumClasses = PointClasses | LineClasses | PlaneClasses;

export function DatumDialog(props: {
  open: boolean;
  close: () => void;
  apply: (datum: IDatumObject) => void;
  datum?: IDatumObject;
}) {
  const {open, close, apply} = props;
  let {datum} = props;

  const dispatch = useDispatch();

  const {uitgd} = store.getState();
  const zindex = uitgd.fullScreenZIndex + uitgd.dialogZIndex;

  const {menuZIndex} = uitgd;

  const [datumType, setDatumType] = React.useState<DatumTypes | ''>(
    getDatumType(datum)
  );
  const [datumClass, setDatumClass] = React.useState<DatumClasses | ''>(
    getDatumClass(datum)
  );

  const [applyReady, setApplyReady] = React.useState<IDatumObject | undefined>(
    undefined
  );
  if (applyReady) datum = applyReady;

  const nameDefault = 'New Datum Object';
  const [nameBuffer, setNameBuffer] = React.useState(
    datum ? datum.name : nameDefault
  );

  let datumTypesSelectable = [getDatumType(datum)];
  if (datumTypesSelectable[0] === '') datumTypesSelectable = [...datumTypes];

  const [selectedClasses, content] =
    datumType === 'Point'
      ? [
          pointClasses,
          <PointObject
            point={isPoint(datum) ? datum : undefined}
            type={datumClass as PointClasses | ''}
            setApplyReady={setApplyReady}
            key="point"
          />
        ]
      : datumType === 'Line'
      ? [
          lineClasses,
          <LineObject
            line={isLine(datum) ? datum : undefined}
            type={datumClass as LineClasses | ''}
            setApplyReady={setApplyReady}
            key="line"
          />
        ]
      : datumType === 'Plane'
      ? [
          planeClasses,
          <PlaneObject
            plane={isPlane(datum) ? datum : undefined}
            type={datumClass as PlaneClasses | ''}
            setApplyReady={setApplyReady}
            key="plane"
          />
        ]
      : [[], null];

  const handleDatumTypeChange = (event: SelectChangeEvent<DatumTypes | ''>) => {
    const {
      target: {value}
    } = event;
    setDatumType(value as DatumTypes | '');
    setDatumClass('');
  };
  const handleDatumClassChange = (
    event: SelectChangeEvent<DatumClasses | ''>
  ) => {
    const {
      target: {value}
    } = event;
    setDatumClass(value as DatumClasses | '');
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
  }, [open]);

  return (
    <Dialog
      open={open}
      components={{Backdrop: undefined}}
      PaperComponent={(props) =>
        PaperComponentDraggable({
          ...props,
          position: (state: RootState) =>
            state.uigd.present.dialogState.datumDialogInitialPosition,
          setPosition: setDatumDialogPosition
        })
      }
      aria-labelledby="draggable-dialog-title"
      sx={{
        zIndex: `${zindex}!important`,
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
          if (datum && datum.name !== value) {
            setApplyReady(datum);
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
              value={datumType}
              onChange={handleDatumTypeChange}
              sx={{
                '& legend': {display: 'none'},
                '& fieldset': {top: 0},
                width: 200
              }}
              input={<OutlinedInput sx={{width: 200}} />}
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return <em>Select Datum Type</em>;
                }
                return selected;
              }}
              MenuProps={{
                sx: {zIndex: zindex + menuZIndex}
              }}
            >
              <MenuItem disabled value="">
                <em>Select Datum Type</em>
              </MenuItem>
              {datumTypesSelectable.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <Select
              displayEmpty
              value={datumClass}
              onChange={handleDatumClassChange}
              sx={{
                ml: 3,
                '& legend': {display: 'none'},
                '& fieldset': {top: 0},
                width: 200
              }}
              input={<OutlinedInput />}
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return <em>Select Datum Class</em>;
                }
                return selected;
              }}
              MenuProps={{
                sx: {zIndex: zindex + menuZIndex}
              }}
            >
              <MenuItem disabled value="">
                <em>Select Datum Class</em>
              </MenuItem>
              {selectedClasses.map((type) => (
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

function getDatumType(datum?: IDatumObject): DatumTypes | '' {
  if (isPoint(datum)) return 'Point';
  if (isLine(datum)) return 'Line';
  if (isPlane(datum)) return 'Plane';
  return '';
}

function getDatumClass(datum?: IDatumObject): DatumClasses | '' {
  if (isPoint(datum)) {
    return getPointObjectClass(datum);
  }
  if (isLine(datum)) {
    return getLineObjectClass(datum);
  }
  if (isPlane(datum)) {
    return getPlaneObjectClass(datum);
  }
  return '';
}
