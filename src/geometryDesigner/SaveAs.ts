import {getDataToSave} from '@app/utils/axios';
import axios, {AxiosRequestConfig, AxiosPromise} from 'axios';
import {RefetchOptions} from 'axios-hooks';
import {Dispatch, AnyAction} from 'redux';
import {
  setTopAssembly,
  getSetTopAssemblyParams
} from '@store/reducers/dataGeometryDesigner';
import store from '@store/store';
import {setConfirmDialogProps} from '@store/reducers/uiTempGeometryDesigner';

type Func = (
  config?: AxiosRequestConfig<any> | undefined,
  options?: RefetchOptions | undefined
) => AxiosPromise<any>;

export default async function saveAs(params: {
  dispatch: Dispatch<AnyAction>;
  filename: string;
  note: string;
  overwrite: boolean;
  updateDataFuncAxiosHooks: Func;
  zindex?: number;
  next?: () => void;
}) {
  const {dispatch, next, filename, note, overwrite, updateDataFuncAxiosHooks} =
    params;

  const {fullScreenZIndex} = store.getState().uitgd;
  const zindex = (params.zindex ?? fullScreenZIndex + 10000) + 1;
  try {
    const res: any = await updateDataFuncAxiosHooks({
      data: getDataToSave(filename, note, overwrite),
      headers: {
        'content-type': 'multipart/form-data'
      }
    });
    dispatch(setTopAssembly(getSetTopAssemblyParams(res.data)));
    if (next) next();
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
              title: `${filename} is already exists.`,
              message: 'Overwite?',
              buttons: [
                {text: 'Overwrite', res: 'ok'},
                {text: 'Cancel', res: 'cancel', autoFocus: true}
              ]
            })
          );
        });
        dispatch(setConfirmDialogProps(undefined));
        if (ret === 'ok') {
          saveAs({
            ...params,
            overwrite: true
          });
        }
      }
    }
  }
}
