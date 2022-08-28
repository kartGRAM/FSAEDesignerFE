import React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import {setSaveAsDialogProps} from '@store/reducers/uiTempGeometryDesigner';

export default function SaveAs(props: {disabled?: boolean}) {
  const {disabled} = props;
  const dispatch = useDispatch();

  const handleOnClick = () => {
    dispatch(setSaveAsDialogProps({onClose: () => {}}));
  };

  return (
    <MenuItem disabled={disabled} onClick={handleOnClick}>
      Save As...
    </MenuItem>
  );
}
