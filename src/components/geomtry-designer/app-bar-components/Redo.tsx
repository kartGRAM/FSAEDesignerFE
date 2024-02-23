import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';

import {useDispatch, useSelector} from 'react-redux';
import {ActionCreators} from 'redux-undo';
import {RootState} from '@store/store';

export default function Redo() {
  const dispatch = useDispatch();

  const redoable = useSelector(
    (state: RootState) => state.dgd.future.length !== 0
  );
  const handleOnClick = () => {
    dispatch(ActionCreators.redo());
  };

  return (
    <MenuItem onClick={handleOnClick} disabled={!redoable}>
      Redo
    </MenuItem>
  );
}
