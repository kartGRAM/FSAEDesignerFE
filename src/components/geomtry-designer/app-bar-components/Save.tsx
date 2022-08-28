import React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import saveAs from '@gd/SaveAs';
// import useAxios from 'axios-hooks';
import {instance} from '@app/utils/axios';
import {AxiosRequestConfig, AxiosPromise} from 'axios';

export default function SaveAs(props: {disabled?: boolean}) {
  const {disabled} = props;
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
      disabled={disabled}
      onClick={() => {
        handleOnClick();
      }}
    >
      Save
    </MenuItem>
  );
}
