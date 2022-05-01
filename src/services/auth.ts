// import axios from 'axios';
import {instance as axios} from '@app/utils/axios';

export const checkLoggedIn = async () => {
  let result: boolean = false;
  const params = new URL(window.location.href).searchParams;

  if (params.get('session_key')) {
    document.cookie = `sessionid=${params.get('session_key')!}`;
  }
  if (params.get('csrf_token')) {
    document.cookie = `csrftoken=${params.get('csrf_token')!}`;
  }

  await axios
    .post(`api/check_logged_in/`, {})
    // eslint-disable-next-line no-unused-vars
    .then((response) => {
      window.history.pushState({}, '', `${new URL(window.location.origin)}`);
      result = true;
    })
    // eslint-disable-next-line no-unused-vars
    .catch((error) => {
      result = false;
    });
  return result;
};
