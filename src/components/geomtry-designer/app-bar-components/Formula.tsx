import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import {setFormulaDialogOpen} from '@store/reducers/uiTempGeometryDesigner';

export default function Formula() {
  const dispatch = useDispatch();
  const handleOnClick = () => {
    dispatch(setFormulaDialogOpen({open: true}));
  };

  return <MenuItem onClick={handleOnClick}>Formula</MenuItem>;
}
