import axios from 'axios';
import store from '@store/store';
import {logoutUser} from '@store/reducers/auth';
import {configure} from 'axios-hooks';

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
