import React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import saveAs from '@gd/SaveAs';
import useAxios from 'axios-hooks';

export default function SaveAs() {
  const dispatch = useDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [{data, loading, error}, updateData] = useAxios(
    {
      url: '/api/gd/save_as/',
      method: 'POST'
    },
    {
      manual: true
    }
  );

  const handleOnClick = () => {
    saveAs({
      dispatch,
      overwrite: true,
      updateDataFuncAxiosHooks: updateData
    });
  };

  return <MenuItem onClick={handleOnClick}>Save</MenuItem>;
}
