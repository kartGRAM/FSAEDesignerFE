import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import {setTopAssembly} from '@app/store/reducers/dataGeometryDesigner';

export default function GDMIClose() {
  const dispatch = useDispatch();
  const handleOnClick = () => {
    dispatch(setTopAssembly(undefined));
  };

  return <MenuItem onClick={handleOnClick}>Close</MenuItem>;
}
