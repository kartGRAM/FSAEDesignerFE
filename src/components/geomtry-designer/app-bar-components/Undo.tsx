import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch, useSelector} from 'react-redux';
import {ActionCreators} from 'redux-undo';
import {RootState} from '@store/store';

export default function Undo() {
  const dispatch = useDispatch();
  const undoable = useSelector(
    (state: RootState) => state.dgd.past.length !== 0
  );

  const handleOnClick = () => {
    dispatch(ActionCreators.undo());
  };

  return (
    <MenuItem onClick={handleOnClick} disabled={!undoable}>
      Undo
    </MenuItem>
  );
}
