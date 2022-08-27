// eslint-disable-next-line @typescript-eslint/no-unused-vars
import store from '@store/store';
import {ActionCreators} from 'redux-undo';
import {instance} from '@app/utils/axios';
import saveAs from '@gd/SaveAs';
import {AxiosRequestConfig, AxiosPromise} from 'axios';
import {RefetchOptions} from 'axios-hooks';

export default function shortCutKeys(e: KeyboardEvent) {
  if (e.ctrlKey) {
    if (e.key === 'z') store.dispatch(ActionCreators.undo());
    else if (e.key === 'y') store.dispatch(ActionCreators.redo());
    else if (e.key === 's') {
      e.preventDefault();
      const func = (
        config?: AxiosRequestConfig<any> | undefined,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        options?: RefetchOptions | undefined
      ): AxiosPromise<any> => {
        return instance.post('/api/gd/save_as/', config?.data, config);
      };
      saveAs({
        dispatch: store.dispatch,
        overwrite: true,
        updateDataFuncAxiosHooks: func
      });
    } else if (e.key === 'c') {
      console.log('ctrl-c');
      // e.preventDefault();
    } else if (e.key === 'x') {
      console.log('ctrl-x');
      // e.preventDefault();
    } else if (e.key === 'v') {
      console.log('ctrl-v');
      // e.preventDefault();
    }
  }
}
