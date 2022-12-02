import React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Dialog from '@mui/material/Dialog';
import {useSelector, useDispatch} from 'react-redux';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import {RootState} from '@store/store';
import PaperComponentDraggable from '@gdComponents/PaperComponentDraggable';
import {setRecordingDialogOpen} from '@store/reducers/uiTempGeometryDesigner';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import DownloadIcon from '@mui/icons-material/Download';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import useUpdateEffect from '@app/hooks/useUpdateEffect';
import {getCanvas} from '@gdComponents/GDScene';

export function RecordingDialog() {
  const open = useSelector(
    (state: RootState) => state.uitgd.gdDialogState.RecordingDialogOpen
  );

  useUpdateEffect(() => {
    setRec(false);
    setFileURL('#');
  }, [open]);

  const dispatch = useDispatch();
  const [rec, setRec] = React.useState(false);
  const [fileURL, setFileURL] = React.useState('#');

  const zindex =
    useSelector((state: RootState) => state.uitgd.fullScreenZIndex) + 1000;

  useUpdateEffect(() => {
    if (!rec) return () => {};
    const canvas = getCanvas();
    if (!canvas) return () => {};
    try {
      const stream = canvas.captureStream();
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        const videoBlob = new Blob([e.data], {type: e.data.type});
        const blobUrl = window.URL.createObjectURL(videoBlob);
        setFileURL(blobUrl);
      };
      recorder.start();
      return () => {
        recorder.stop();
      };
    } catch (e) {
      setRec(false);
      // eslint-disable-next-line no-console
      console.log(e);
      return () => {};
    }
  }, [rec]);

  const startRecording = () => {
    setRec(true);
    setFileURL('#');
  };

  const stopRecording = () => {
    setRec(false);
  };

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
      <DialogContent>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton
            aria-label="record"
            size="small"
            onClick={startRecording}
            disabled={rec}
          >
            <FiberManualRecordIcon
              sx={{color: !rec ? '#DD0000' : undefined}}
              fontSize="large"
            />
          </IconButton>
          <IconButton
            aria-label="stop"
            size="small"
            onClick={stopRecording}
            disabled={!rec}
          >
            <StopIcon
              fontSize="large"
              sx={{color: rec ? '#0000cc' : undefined}}
            />
          </IconButton>
          <IconButton
            aria-label="download"
            size="large"
            disabled={fileURL === '#'}
          >
            <a href={fileURL} download="movie.webm">
              <DownloadIcon
                fontSize="large"
                sx={{color: fileURL !== '#' ? '#00cc00' : '#cccccc'}}
              />
            </a>
          </IconButton>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
