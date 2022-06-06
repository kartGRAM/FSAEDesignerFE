import React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {clear} from 'redux-localstorage-simple';

export default function GDMIOpenFromTemplates() {
  const handleOnClick = () => {
    clear({
      namespace: 'FSAEDesigner'
    });
  };

  return <MenuItem onClick={handleOnClick}> Reset UI Settings</MenuItem>;
}
