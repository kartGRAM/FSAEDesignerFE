import React, {useEffect} from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import {setTopAssembly} from '@app/store/reducers/dataGeometryDesigner';
import {getSuspension} from '@app/geometryDesigner/SampleGeometry';

export default function GDMIOpenFromTemplates() {
  const dispatch = useDispatch();
  const handleOnClick = () => {
    const sample = getSuspension();
    dispatch(setTopAssembly(sample));
  };

  // とりあえずテスト用に入れる
  useEffect(() => {
    handleOnClick();
  }, []);

  return (
    <MenuItem onClick={handleOnClick}> New Assembly From Templates</MenuItem>
  );
}
