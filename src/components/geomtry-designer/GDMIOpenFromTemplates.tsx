import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import {setTopAssembly} from '@store/reducers/geometryDesigner';
import {getSuspension} from '@app/geometryDesigner/SampleGeometry';

export default function GDMIOpenFromTemplates() {
  const dispatch = useDispatch();
  const handleOnClick = () => {
    const sample = getSuspension();
    dispatch(setTopAssembly(sample));
  };

  return (
    <MenuItem onClick={handleOnClick}> New Assembly From Templates</MenuItem>
  );
}
