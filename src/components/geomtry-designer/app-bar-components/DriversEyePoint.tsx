import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import {setDriversEyeDialogOpen} from '@store/reducers/uiTempGeometryDesigner';

export default function DriversEyePoint() {
  const disabled = false;
  const dispatch = useDispatch();

  const handleOnClick = () => {
    dispatch(setDriversEyeDialogOpen({open: true}));
  };

  return (
    <MenuItem disabled={disabled} onClick={handleOnClick}>
      Driver&apos;s eye point
    </MenuItem>
  );
}
