import axios from 'axios';
import store from '@store/store';
import {logoutUser} from '@store/reducers/auth';
import {configure} from 'axios-hooks';

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
): any {
  const state = store.getState().dgd;
  return {
    id: state.id,
    name: filename,
    note,
    clientLastUpdated: state.lastUpdated,
    content: JSON.stringify(state.topAssembly),
    overwrite
  };
}
