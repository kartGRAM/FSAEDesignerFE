/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch, useSelector} from 'react-redux';
import {updateAssembly} from '@store/reducers/dataGeometryDesigner';
import {getElementByPath, MirrorError} from '@gd/IElements';
import store from '@app/store/store';

import {setConfirmDialogProps} from '@store/reducers/uiTempGeometryDesigner';

interface Props {
  text?: string;
  disabled?: boolean;
}
export default function CreateMirror(props: Props) {
  const {text, disabled} = props;
  const dispatch = useDispatch();

  const handleOnClick = React.useCallback(async () => {
    const {assembly} = store.getState().uitgd;
    const selectedElement = store.getState().uitgd.selectedElementAbsPath;
    const element = getElementByPath(assembly, selectedElement);
    const parent = element?.parent;
    const {fullScreenZIndex} = store.getState().uitgd;
    if (!parent) {
      const ret = await new Promise<string>((resolve) => {
        dispatch(
          setConfirmDialogProps({
            zindex: fullScreenZIndex + 10000 + 1,
            onClose: resolve,
            title: 'Notice',
            message: `You can't mirror the root component.`,
            buttons: [{text: 'OK', res: 'ok', autoFocus: true}]
          })
        );
      });
      dispatch(setConfirmDialogProps(undefined));
    }
    if (!element || !parent) return;
    try {
      const mirElement = element.getMirror();
      parent.appendChild(mirElement);
      parent.getRoot()?.getDataElement(store.getState().dgd.present);
      dispatch(updateAssembly(parent));
    } catch (e: unknown) {
      if (e instanceof MirrorError) {
        dispatch(updateAssembly(parent));
        const ret = await new Promise<string>((resolve) => {
          dispatch(
            setConfirmDialogProps({
              zindex: fullScreenZIndex + 10000 + 1,
              onClose: resolve,
              title: 'Notice',
              message: `You can't create mirrors of mirrored components.`,
              buttons: [{text: 'OK', res: 'ok', autoFocus: true}]
            })
          );
        });
        dispatch(setConfirmDialogProps(undefined));
      } else {
        console.log('未知のエラー');
      }
    }
  }, []);

  return (
    <MenuItem disabled={disabled} onClick={handleOnClick}>
      {text ?? 'CreateMirror'}
    </MenuItem>
  );
}
