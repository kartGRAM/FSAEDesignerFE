import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import {selectSidePanelTab} from '@app/store/reducers/uiTempGeometryDesigner';
import confirmIfChanged from '@app/utils/confirmIfChanged';

export default function Close() {
  const dispatch = useDispatch();
  const handleOnClick = () => {
    confirmIfChanged(dispatch, undefined, null, () => {
      dispatch(selectSidePanelTab({tab: 'elements'}));
    });
  };

  return <MenuItem onClick={handleOnClick}>Close</MenuItem>;
}
