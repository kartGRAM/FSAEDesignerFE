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
