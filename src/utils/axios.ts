// import axios, {AxiosRequestConfig} from 'axios';
import axios from 'axios';
// import store from '@store/store';
// import {logoutUser} from '@store/reducers/auth';

document.cookie = 'sessionid=ngz4ie9knrt5ntjj6du35qsimwma2zsx';
document.cookie =
  'csrftoken=sCO4lNnel9noTNQh42a1HkSnjrpJkNRBy8ae1jpSyhTOiH22dVNswvmk6gaG7xTL';

const instance = axios.create({
  // baseURL: `${process.env.REACT_APP_GATEKEEPER_URL}`,
  withCredentials: true
});

/*
instance.interceptors.request.use(
  (request: AxiosRequestConfig<any>) => {
    const {token} = store.getState().auth;
    if (token) {
      request.headers = {...request.headers, Authorization: `Bearer ${token}`};
    }
    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.data.status === 401) {
      store.dispatch(logoutUser());
    }
    return Promise.reject(error);
  }
);
*/

export {instance};
