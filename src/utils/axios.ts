import axios from 'axios';
import store from '@store/store';
import {logoutUser} from '@store/reducers/auth';
import {configure} from 'axios-hooks';
import {getScreenShot} from '@gdComponents/GDScene';
import {SavedDataToSend} from '@gd/ISaveData';

const instance = axios.create({
  baseURL: store.getState().auth.apiURLBase!,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFTOKEN',
  timeout: 5000
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.data.status === 401) {
      store.dispatch(logoutUser());
    }
    return Promise.reject(error);
  }
);

configure({axios: instance});

export {instance};

export function getDataToSave(
  filename: string,
  note: string,
  overwrite: boolean = false
): FormData {
  const rootState = store.getState();
  const state = rootState.dgd.present;

  let {topAssembly} = state;
  if (rootState.uitgd.assembly) {
    topAssembly = rootState.uitgd.assembly.getDataElement(state);
  }

  const data = new FormData();
  const values: SavedDataToSend = {
    id: state.id,
    name: filename,
    note,
    content: JSON.stringify(topAssembly),
    formulae: JSON.stringify(state.formulae),
    controls: JSON.stringify(state.controls),
    datumObjects: JSON.stringify(state.datumObjects),
    measureTools: JSON.stringify(state.measureTools),
    clientLastUpdated: state.lastUpdated,
    overwrite
  };
  Object.keys(values).forEach((key) => {
    data.append(key, (values as any)[key]);
  });
  data.append('thumbnail', getScreenShot() ?? '', 'image.png');
  return data;
}
