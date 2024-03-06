import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {setConfirmDialogProps} from '@store/reducers/uiTempGeometryDesigner';

export type ConfirmDialogProps = {
  zindex: number;
  onClose: (value: string) => void;
  title?: string | React.ReactNode;
  message?: string | React.ReactNode;
  buttons: {text: string; res: string; autoFocus?: boolean}[];
};

export default function ConfirmDialog() {
  const props = useSelector(
    (state: RootState) => state.uitgd.gdDialogState.confirmDialogProps
  );
  const {onClose} = props ?? {onClose: () => {}};
  const dispatch = useDispatch();
  const onCloseWrapper = React.useCallback(
    (value: string) => {
      onClose(value);
      dispatch(setConfirmDialogProps(undefined));
    },
    [dispatch, onClose]
  );

  if (!props) return null;
  const {zindex, title, message, buttons} = props;

  return (
    <Dialog
      open
      onClose={() => onCloseWrapper('cancel')}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      sx={{
        zIndex: `${zindex}!important`,
        backdropFilter: 'blur(3px)'
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        {buttons.map((button) => (
          <Button
            onClick={() => onCloseWrapper(button.res)}
            autoFocus={button.autoFocus}
            key={button.text}
          >
            {button.text}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
}
