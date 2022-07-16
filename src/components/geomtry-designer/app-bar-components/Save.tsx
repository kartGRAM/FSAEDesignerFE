import React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import saveAs from '@gd/SaveAs';
import useAxios from 'axios-hooks';

export default function SaveAs() {
  const dispatch = useDispatch();
  const filename = useSelector((state: RootState) => state.dgd.filename);
  const note = useSelector((state: RootState) => state.dgd.note);
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
      filename,
      note,
      overwrite: true,
      updateDataFuncAxiosHooks: updateData
    });
  };

  return <MenuItem onClick={handleOnClick}>Save</MenuItem>;
}
