import React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import {setOpenDialogOpen} from '@store/reducers/uiTempGeometryDesigner';

export default function Open() {
  const dispatch = useDispatch();
  const handleOnClick = () => {
    dispatch(setOpenDialogOpen({open: true}));
  };

  return <MenuItem onClick={handleOnClick}>Open File..</MenuItem>;
}
