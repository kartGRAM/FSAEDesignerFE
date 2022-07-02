import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog, {DialogProps} from '@mui/material/Dialog';
import AddIcon from '@mui/icons-material/Add';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {setFormulaDialogOpen} from '@store/reducers/uiTempGeometryDesigner';

export function FormulaDialog(props: DialogProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formulaDialogOpen: boolean = useSelector(
    (state: RootState) => state.uitgd.gdDialogState.formulaDialogOpen
  );
  const dispatch = useDispatch();
  const {onClose} = props;

  const handleClose = (e: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (onClose) onClose(e, reason);
    dispatch(setFormulaDialogOpen({open: false}));
  };

  return (
    <Dialog {...props} onClose={handleClose} open={formulaDialogOpen}>
      <DialogTitle>Set backup account</DialogTitle>
      <List sx={{pt: 0}}>
        <ListItem autoFocus>
          <ListItemAvatar>
            <Avatar>
              <AddIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary="Add account" />
        </ListItem>
      </List>
    </Dialog>
  );
}
