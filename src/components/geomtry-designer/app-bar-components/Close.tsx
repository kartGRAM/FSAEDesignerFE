import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import {selectSidePanelTab} from '@app/store/reducers/uiTempGeometryDesigner';
import confirmIfChanged from '@app/utils/confirmIfChanged';
import {Frame} from '@gd/Elements';
import {newAssembly} from '@store/reducers/dataGeometryDesigner';

interface Props {
  text?: string;
  disabled?: boolean;
}
export default function Close(props: Props) {
  const {text, disabled} = props;
  const dispatch = useDispatch();
  const handleOnClick = () => {
    confirmIfChanged(dispatch, () => {
      const reset = async () => {
        if (text) {
          const frame = new Frame({name: 'newFrame', children: []});
          await dispatch(newAssembly(frame));
          return;
        }
        await dispatch(newAssembly(undefined));
      };
      reset();
      dispatch(selectSidePanelTab({tab: 'elements'}));
    });
  };

  return (
    <MenuItem disabled={disabled} onClick={handleOnClick}>
      {text ?? 'Close'}
    </MenuItem>
  );
}
