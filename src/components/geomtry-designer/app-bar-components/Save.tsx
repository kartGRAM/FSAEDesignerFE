import React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import saveAs from '@gd/SaveAs';
// import useAxios from 'axios-hooks';
import {sleep} from '@app/utils/helpers';
import {instance} from '@app/utils/axios';
import {AxiosRequestConfig, AxiosPromise} from 'axios';

export default function SaveAs() {
  const dispatch = useDispatch();
  const sendData = (
    config: AxiosRequestConfig<any> | undefined
  ): AxiosPromise<any> => {
    return instance.post('/api/gd/save_as/', config?.data, config);
  };

  const handleOnClick = async () => {
    await saveAs({
      dispatch,
      overwrite: true,
      updateDataFuncAxiosHooks: sendData
    });
  };

  return (
    <MenuItem
      onClick={() => {
        handleOnClick();
        sleep(5000);
      }}
    >
      Save
    </MenuItem>
  );
}
