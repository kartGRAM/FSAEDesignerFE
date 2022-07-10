import axios from 'axios';
import store from '@store/store';
import {logoutUser} from '@store/reducers/auth';
import {configure} from 'axios-hooks';
import {getScreenShot} from '@gdComponents/GDScene';

const instance = axios.create({
  baseURL: store.getState().auth.apiURLBase!,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFTOKEN'
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getDataToSave(
  filename: string,
  note: string,
  overwrite: boolean = false
): FormData {
  const state = store.getState().dgd;
  const data = new FormData();
  const values: any = {
    id: state.id,
    name: filename,
    note,
    content: JSON.stringify(state.topAssembly),
    clientLastUpdated: state.lastUpdated,
    overwrite
  };
  Object.keys(values).forEach((key) => {
    data.append(key, values[key]);
  });
  data.append('thumbnail', getScreenShot() ?? '', 'image.png');
  return data;
}
