import {Dispatch, AnyAction} from 'redux';
import {
  setSaveAsDialogOpen,
  setConfirmDialogProps
} from '@store/reducers/uiTempGeometryDesigner';
import {
  setTopAssembly,
  SetTopAssemblyParams
} from '@store/reducers/dataGeometryDesigner';
import store from '@store/store';

export default async function cinfirmIfChanged(
  dispatch: Dispatch<AnyAction>,
  params: SetTopAssemblyParams,
  zindex: number,
  ifSave: () => void,
  ifNotChangedOrNoSave: () => void
) {
  const {changed, filename} = store.getState().dgd;
  if (changed) {
    const ret = await new Promise<string>((resolve) => {
      dispatch(
        setConfirmDialogProps({
          zindex: zindex + 1,
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
      ifSave();
      return;
    }
  }
  dispatch(setTopAssembly(params));
  ifNotChangedOrNoSave();
}
