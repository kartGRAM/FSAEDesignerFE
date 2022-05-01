import {createSlice} from '@reduxjs/toolkit';

export interface AuthState {
  isLoggedIn: boolean;
  loggingOut: boolean;
  currentUser: any;
  apiURLBase: string | null;
}

const initialState: AuthState = {
  isLoggedIn: false,
  loggingOut: false,
  currentUser: {
    email: 'mail@example.com',
    picture: null
  },
  apiURLBase: 'http://127.0.0.1:8000'
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginUser: (state) => {
      state.isLoggedIn = true;
    },
    // eslint-disable-next-line no-unused-vars
    logoutUser: (state) => {
      if (navigator.cookieEnabled) {
        // cookieに保存した値の処理後、不要になったcookieを削除する。
        document.cookie = 'sessionid=; max-age=0';
        document.cookie = 'csrftoken=; max-age=0';
      }
      state.isLoggedIn = false;
      state.loggingOut = true;
    },
    // eslint-disable-next-line no-unused-vars
    loadUser: (state, {payload}) => {
      // state.currentUser = payload;
    }
  }
});

export const {loginUser, logoutUser, loadUser} = authSlice.actions;

export default authSlice.reducer;
