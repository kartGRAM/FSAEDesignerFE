import {getDataToSave, getSetTopAssemblyParams} from '@gd/ISaveData';
import axios, {AxiosRequestConfig, AxiosPromise} from 'axios';
import {RefetchOptions} from 'axios-hooks';
import {useDispatch} from 'react-redux';
import {setTopAssembly} from '@store/reducers/dataGeometryDesigner';

import store from '@store/store';
import {
  setConfirmDialogProps,
  setSaveAsDialogProps
} from '@store/reducers/uiTempGeometryDesigner';

type Func = (
  config?: AxiosRequestConfig<any> | undefined,
  options?: RefetchOptions | undefined
) => AxiosPromise<any>;

export default async function saveAs(params: {
  dispatch: ReturnType<typeof useDispatch>;
  filename?: string;
  note?: string;
  overwrite: boolean;
  skipIDCheck?: boolean;
  updateDataFuncAxiosHooks: Func;
  zindex?: number;
  next?: () => void;
}) {
  const {
    dispatch,
    next,
    filename: tfilename,
    note: tnote,
    overwrite,
    skipIDCheck,
    updateDataFuncAxiosHooks
  } = params;

  const {fullScreenZIndex, dialogZIndex} = store.getState().uitgd;
  const {id} = store.getState().dgd.present;
  const zindex = params.zindex ?? fullScreenZIndex + dialogZIndex * 2;
  const filename = tfilename ?? store.getState().dgd.present.filename;
  const rootState = store.getState();
  const note = tnote ?? rootState.dgd.present.note;
  try {
    if (overwrite && id === Number.MAX_SAFE_INTEGER && !skipIDCheck) {
      dispatch(
        setSaveAsDialogProps({
          onClose: (ret) => {
            if (ret === 'saved' && next) next();
          }
        })
      );
    } else {
      const res: any = await updateDataFuncAxiosHooks({
        data: getDataToSave(rootState, filename, note, overwrite),
        headers: {
          'content-type': 'multipart/form-data'
        }
      });
      dispatch(setTopAssembly(getSetTopAssemblyParams(res.data)));
      if (next) next();
    }
  } catch (err) {
    if (
      axios.isAxiosError(err) &&
      err.response &&
      err.response.status === 409
    ) {
      const errorMessage: any = err.response.data;
      if (errorMessage.error === 'File already exists.') {
        const ret = await new Promise<string>((resolve) => {
          dispatch(
            setConfirmDialogProps({
              zindex: zindex + 1,
              onClose: resolve,
              title: `${filename} already exists.`,
              message: 'Overwite?',
              buttons: [
                {text: 'Overwrite', res: 'ok'},
                {text: 'Cancel', res: 'cancel', autoFocus: true}
              ]
            })
          );
        });

        if (ret === 'ok') {
          saveAs({
            ...params,
            overwrite: true,
            skipIDCheck: true
          });
        }
      }
    }
  }
}
