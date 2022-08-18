import React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import {setTopAssembly} from '@app/store/reducers/dataGeometryDesigner';
import {getSampleData} from '@app/geometryDesigner/SampleGeometry';

export default function OpenFromTemplates() {
  const dispatch = useDispatch();
  const handleOnClick = async () => {
    const data = await getSampleData();
    dispatch(setTopAssembly(data));
  };

  /* とりあえずテスト用に入れる
  useEffect(() => {
    handleOnClick();
  }, []); */

  return (
    <MenuItem onClick={handleOnClick}> New Assembly From Templates</MenuItem>
  );
}
