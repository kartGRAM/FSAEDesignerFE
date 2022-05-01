import {removeWindowClass} from '@app/utils/helpers';
import {Gatekeeper} from 'gatekeeper-client-sdk';
import axios from 'axios';

export const checkLoggedIn = async (apiURL: any) => {
  let result: boolean = false;
  const params = new URL(window.location.href).searchParams;

  if (params.get('session_key')) {
    document.cookie = `sessionid=${params.get('session_key')!}`;
  }
  if (params.get('csrf_token')) {
    document.cookie = `csrftoken=${params.get('csrf_token')!}`;
  }

  await axios
    .post(
      `${apiURL}api/check_logged_in/`,
      {},
      {
        xsrfCookieName: 'csrftoken',
        xsrfHeaderName: 'X-CSRFTOKEN',
        withCredentials: true
      }
    )
    // eslint-disable-next-line no-unused-vars
    .then((response) => {
      result = true;
    })
    // eslint-disable-next-line no-unused-vars
    .catch((error) => {
      result = false;
    });
  return result;
};

export const loginByAuth = async (email: string, password: string) => {
  const token = await Gatekeeper.loginByAuth(email, password);
  localStorage.setItem('token', token);
  removeWindowClass('login-page');
  removeWindowClass('hold-transition');
  return token;
};

export const registerByAuth = async (email: string, password: string) => {
  const token = await Gatekeeper.registerByAuth(email, password);
  localStorage.setItem('token', token);
  removeWindowClass('register-page');
  removeWindowClass('hold-transition');
  return token;
};

export const loginByGoogle = async () => {
  const token = await Gatekeeper.loginByGoogle();
  localStorage.setItem('token', token);
  removeWindowClass('login-page');
  removeWindowClass('hold-transition');
  return token;
};

export const registerByGoogle = async () => {
  const token = await Gatekeeper.registerByGoogle();
  localStorage.setItem('token', token);
  removeWindowClass('register-page');
  removeWindowClass('hold-transition');
  return token;
};

export const loginByFacebook = async () => {
  const token = await Gatekeeper.loginByFacebook();
  localStorage.setItem('token', token);
  removeWindowClass('login-page');
  removeWindowClass('hold-transition');
  return token;
};

export const registerByFacebook = async () => {
  const token = await Gatekeeper.registerByFacebook();
  localStorage.setItem('token', token);
  removeWindowClass('register-page');
  removeWindowClass('hold-transition');
  return token;
};
