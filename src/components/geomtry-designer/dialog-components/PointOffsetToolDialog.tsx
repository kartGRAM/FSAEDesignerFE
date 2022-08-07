import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {
  setPointOffsetToolDialogProps,
  setUIDisabled
} from '@store/reducers/uiTempGeometryDesigner';
import {setPointOffsetToolDialogInitialPosition} from '@store/reducers/uiGeometryDesigner';
import Paper, {PaperProps} from '@mui/material/Paper';
import Draggable from 'react-draggable';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import {
  listPointOffsetTools,
  getPointOffsetTool,
  isDeltaXYZ,
  isDirectionLength
} from '@gd/NamedValues';
import {IDataPointOffsetTool} from '@gd/IDataValues';
import {DeltaXYZ} from '@gdComponents/dialog-components/PointOffsetToolDialogComponents/DeltaXYZ';
import {DirectionLength} from '@gdComponents/dialog-components/PointOffsetToolDialogComponents/DirectionLength';
import Divider from '@mui/material/Divider';

export interface PointOffsetToolDialogProps {
  open: boolean;
  data: IDataPointOffsetTool;
}

export function PointOffsetToolDialog() {
  const props = useSelector(
    (state: RootState) => state.uitgd.gdDialogState.pointOffsetToolDialogProps
  );
  const {open, data} = props;
  const tool = getPointOffsetTool(data);
  const [type, setType] = React.useState(tool.className);
  const [isValid, setIsValid] = React.useState(false);
  const [handleOK, setHandleOK] = React.useState<() => void>(() => {});

  const zindex =
    useSelector((state: RootState) => state.uitgd.fullScreenZIndex) + 1000;
  const dispatch = useDispatch();
  React.useEffect(() => {
    if (open) {
      dispatch(setUIDisabled(true));
    } else {
      dispatch(setUIDisabled(false));
    }
  }, [open]);

  // eslint-disable-next-line no-undef
  let component: JSX.Element | null = null;
  if (type === 'DeltaXYZ') {
    component = (
      <DeltaXYZ
        name={tool.name}
        tool={isDeltaXYZ(tool) ? tool : undefined}
        setIsValid={setIsValid}
        setHandleOK={setHandleOK}
      />
    );
  } else if (type === 'DirectionLength') {
    component = (
      <DirectionLength
        name={tool.name}
        tool={isDirectionLength(tool) ? tool : undefined}
      />
    );
  }

  const handleChange = (event: SelectChangeEvent) => {
    setType(event.target.value);
  };
  const handleClose = () => {
    dispatch(setPointOffsetToolDialogProps({...props, open: false}));
  };
  return (
    <Dialog
      open={open}
      // onClose={onClose}
      components={{Backdrop: undefined}}
      PaperComponent={PaperCompornent}
      aria-labelledby="draggable-dialog-title"
      sx={{
        zIndex: `${zindex}!important`,
        pointerEvents: 'none'
      }}
    >
      <DialogTitle>Point Offset Tool</DialogTitle>
      <DialogContent>
        <FormControl sx={{m: 1, minWidth: 300}} size="small">
          <InputLabel id="demo-select-small">Type</InputLabel>
          <Select
            labelId="demo-select-small"
            id="demo-select-small"
            value={type}
            label="Type"
            onChange={handleChange}
            MenuProps={{
              sx: {zIndex: zindex + 100}
            }}
          >
            {listPointOffsetTools.map((name) => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Divider />
        {component}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleOK} disabled={!isValid}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PaperCompornent(props: PaperProps) {
  const dispatch = useDispatch();
  const {x, y} = useSelector(
    (state: RootState) =>
      state.uigd.present.dialogState.pointOffsetToolDialogInitialPosition
  );
  return (
    <Draggable
      bounds="parent"
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
      defaultPosition={x && y ? {x, y} : undefined}
      onStop={(e, data) => {
        dispatch(
          setPointOffsetToolDialogInitialPosition({
            x: data.lastX,
            y: data.lastY
          })
        );
      }}
    >
      <Paper
        {...props}
        sx={{
          pointerEvents: 'auto',
          minWidth: 600
        }}
      />
    </Draggable>
  );
}
