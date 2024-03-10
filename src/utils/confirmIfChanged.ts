import {useDispatch} from 'react-redux';
import {
  setConfirmDialogProps,
  setSaveAsDialogProps
} from '@store/reducers/uiTempGeometryDesigner';
import store from '@store/store';

export default async function confirmIfChanged(
  dispatch: ReturnType<typeof useDispatch>,
  next: (() => void) | null,
  zindex?: number
) {
  const {changed, filename} = store.getState().dgd.present;
  const {fullScreenZIndex, dialogZIndex} = store.getState().uitgd;
  if (changed) {
    const ret = await new Promise<string>((resolve) => {
      dispatch(
        setConfirmDialogProps({
          zindex: zindex ?? fullScreenZIndex + dialogZIndex * 2,
          onClose: resolve,
          title: 'Warning!',
          message: `${filename} is changed. Do you seve the file?`,
          buttons: [
            {text: 'Yes', res: 'yes'},
            {text: 'No', res: 'no'},
            {text: 'Cancel', res: 'cancel', autoFocus: true}
          ]
        })
      );
    });

    if (ret === 'yes') {
      const ret = await new Promise<string>((resolve) => {
        dispatch(
          setSaveAsDialogProps({
            onClose: resolve
          })
        );
      });
      if (ret === 'saved') {
        if (next) next();
      }
      return;
    }
    if (ret === 'cancel') {
      return;
    }
  }
  if (next) next();
}
