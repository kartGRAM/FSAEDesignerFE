import React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import {alpha} from '@mui/material/styles';
import {RootState} from '@store/store';
import PaperComponentDraggable from '@gdComponents/PaperComponentDraggable';
import {setRecordingDialogOpen} from '@store/reducers/uiTempGeometryDesigner';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import DownloadIcon from '@mui/icons-material/Download';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';

export function RecordingDialog() {
  const open = useSelector(
    (state: RootState) => state.uitgd.gdDialogState.RecordingDialogOpen
  );
  const dispatch = useDispatch();

  const zindex =
    useSelector((state: RootState) => state.uitgd.fullScreenZIndex) + 1000;

  const startRecording = () => {};

  const stopRecording = () => {};

  const handleDownload = () => {};

  const handleClose = () => {
    stopRecording();
    dispatch(setRecordingDialogOpen({open: false}));
  };

  return (
    <Dialog
      open={open}
      components={{Backdrop: undefined}}
      PaperComponent={PaperComponentDraggable}
      aria-labelledby="draggable-dialog-title"
      sx={{
        zIndex: `${zindex}!important`,
        pointerEvents: 'none'
      }}
    >
      <DialogTitle>Recording Dialog</DialogTitle>
      <DialogContent
        sx={{
          '& .hg-button.assigned': {
            background: alpha('#019fb6', 1),
            color: 'white'
          },
          '& .hg-button.selected': {
            background: alpha('#F00', 0.7),
            color: 'white'
          },
          '& .hg-button.disabled': {
            background: alpha('#000', 0.5),
            color: 'white'
          }
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton aria-label="record" size="small">
            <FiberManualRecordIcon fontSize="large" onClick={startRecording} />
          </IconButton>
          <IconButton aria-label="stop" size="small" onClick={stopRecording}>
            <StopCircleIcon fontSize="large" />
          </IconButton>
          <IconButton
            aria-label="download"
            size="large"
            onClick={handleDownload}
          >
            <DownloadIcon />
          </IconButton>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
