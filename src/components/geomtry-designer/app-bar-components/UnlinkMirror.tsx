import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch, useSelector} from 'react-redux';
import {updateAssembly} from '@store/reducers/dataGeometryDesigner';
import {getElementByPath, isMirror} from '@gd/IElements';

import store, {RootState} from '@app/store/store';

import {setConfirmDialogProps} from '@store/reducers/uiTempGeometryDesigner';

interface Props {
  text?: string;
}
export default function UnlinkMirror(props: Props) {
  const {text} = props;
  const dispatch = useDispatch();

  const assembly = useSelector((state: RootState) => state.uitgd.assembly);
  const selectedElement = useSelector(
    (state: RootState) => state.uitgd.selectedElementAbsPath
  );
  const element = getElementByPath(assembly, selectedElement);

  const {uitgd} = store.getState();
  const zindex = uitgd.fullScreenZIndex + uitgd.dialogZIndex;

  const handleOnClick = React.useCallback(async () => {
    if (!element) return;
    const ret = await new Promise<string>((resolve) => {
      dispatch(
        setConfirmDialogProps({
          zindex,
          onClose: resolve,
          title: 'Warning',
          message: `Once you unlink mirror components, it cannot be restored.`,
          buttons: [
            {text: 'OK', res: 'ok'},
            {text: 'Cancel', res: 'cancel', autoFocus: true}
          ]
        })
      );
    });
    dispatch(setConfirmDialogProps(undefined));
    if (ret === 'ok') {
      element.unlinkMirror();
      dispatch(updateAssembly(element));
    }
  }, [element]);

  return (
    <MenuItem disabled={!isMirror(element)} onClick={handleOnClick}>
      {text ?? 'UnlinkMirror'}
    </MenuItem>
  );
}
