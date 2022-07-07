import React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import {setSaveAsDialogOpen} from '@store/reducers/uiTempGeometryDesigner';

export default function SaveAs() {
  const dispatch = useDispatch();

  const handleOnClick = () => {
    dispatch(setSaveAsDialogOpen({open: true}));
  };

  return <MenuItem onClick={handleOnClick}>Save As...</MenuItem>;
}
