import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export type ConfirmDialogProps = {
  zindex: number;
  onClose: (value: string) => void;
  title?: string;
  message?: string;
  buttons: {text: string; res: string; autoFocus?: boolean}[];
};

export default function ConfirmDialog(props: ConfirmDialogProps) {
  const {zindex, onClose, title, message, buttons} = props;

  return (
    <Dialog
      open
      onClose={() => onClose('cancel')}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      sx={{
        zIndex: `${zindex}!important`,
        backdropFilter: 'blur(3px)'
      }}
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {buttons.map((button) => (
          <Button
            onClick={() => onClose(button.res)}
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
