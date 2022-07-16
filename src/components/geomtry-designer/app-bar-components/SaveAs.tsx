import React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import {setSaveAsDialogProps} from '@store/reducers/uiTempGeometryDesigner';

export default function SaveAs() {
  const dispatch = useDispatch();

  const handleOnClick = () => {
    dispatch(setSaveAsDialogProps({onClose: () => {}}));
  };

  return <MenuItem onClick={handleOnClick}>Save As...</MenuItem>;
}
