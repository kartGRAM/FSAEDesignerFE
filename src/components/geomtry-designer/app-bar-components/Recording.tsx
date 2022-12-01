import React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import {setRecordingDialogOpen} from '@store/reducers/uiTempGeometryDesigner';

export default function Recoding(props: {disabled?: boolean}) {
  const {disabled} = props;
  const dispatch = useDispatch();

  const handleOnClick = () => {
    dispatch(setRecordingDialogOpen({open: true}));
  };

  return (
    <MenuItem
      disabled={disabled}
      onClick={() => {
        handleOnClick();
      }}
    >
      Recoding
    </MenuItem>
  );
}
