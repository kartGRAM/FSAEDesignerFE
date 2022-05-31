import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import {setTopAssembly} from '@store/reducers/geometryDesigner';

export default function GDMIClose() {
  const dispatch = useDispatch();
  const handleOnClick = () => {
    dispatch(setTopAssembly(undefined));
  };

  return <MenuItem onClick={handleOnClick}>Close</MenuItem>;
}
