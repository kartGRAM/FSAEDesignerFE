import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import {selectSidePanelTab} from '@app/store/reducers/uiTempGeometryDesigner';
import confirmIfChanged from '@app/utils/confirmIfChanged';

import {newAssembly} from '@store/reducers/dataGeometryDesigner';

interface Props {
  text?: string;
}
export default function Close(props: Props) {
  const {text} = props;
  const dispatch = useDispatch();
  const handleOnClick = () => {
    confirmIfChanged(dispatch, () => {
      dispatch(newAssembly());
      dispatch(selectSidePanelTab({tab: 'elements'}));
    });
  };

  return <MenuItem onClick={handleOnClick}>{text ?? 'Close'}</MenuItem>;
}
