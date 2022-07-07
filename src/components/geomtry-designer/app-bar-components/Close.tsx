import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import {newAssembly} from '@app/store/reducers/dataGeometryDesigner';
import {selectSidePanelTab} from '@app/store/reducers/uiTempGeometryDesigner';

export default function Close() {
  const dispatch = useDispatch();
  const handleOnClick = () => {
    dispatch(newAssembly());
    dispatch(selectSidePanelTab({tab: 'elements'}));
  };

  return <MenuItem onClick={handleOnClick}>Close</MenuItem>;
}
