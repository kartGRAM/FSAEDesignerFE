import {Dispatch, AnyAction} from 'redux';
import {
  setSaveAsDialogOpen,
  setConfirmDialogProps
} from '@store/reducers/uiTempGeometryDesigner';
import {
  setTopAssembly,
  SetTopAssemblyParams,
  newAssembly
} from '@store/reducers/dataGeometryDesigner';
import store from '@store/store';

export default async function confirmIfChanged(
  dispatch: Dispatch<AnyAction>,
  params: SetTopAssemblyParams | undefined,
  ifSave: (() => void) | null,
  ifNotChangedOrNoSave: (() => void) | null,
  zindex?: number
) {
  const {changed, filename} = store.getState().dgd;
  const {fullScreenZIndex} = store.getState().uitgd;
  if (changed) {
    const ret = await new Promise<string>((resolve) => {
      dispatch(
        setConfirmDialogProps({
          zindex: (zindex ?? fullScreenZIndex + 10000) + 1,
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
    dispatch(setConfirmDialogProps(undefined));
    if (ret === 'yes') {
      dispatch(setSaveAsDialogOpen({open: true}));
      if (ifSave) ifSave();
      return;
    }
    if (ret === 'cancel') {
      return;
    }
  }
  if (params) dispatch(setTopAssembly(params));
  else dispatch(newAssembly());
  if (ifNotChangedOrNoSave) ifNotChangedOrNoSave();
}
