import {createSlice} from '@reduxjs/toolkit';

export interface AuthState {
  isLoggedIn: boolean;
  token: string | null;
  csrfToken: string | null;
  currentUser: any;
  apiURLBase: string | null;
}

const initialState: AuthState = {
  isLoggedIn: !!localStorage.getItem('token'),
  token: localStorage.getItem('token'),
  csrfToken: localStorage.getItem('csrfToken'),
  currentUser: {
    email: 'mail@example.com',
    picture: null
  },
  apiURLBase: 'http://127.0.0.1:8000/'
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
      state.isLoggedIn = false;
    },
    // eslint-disable-next-line no-unused-vars
    loadUser: (state, {payload}) => {
      // state.currentUser = payload;
    }
  }
});

export const {loginUser, logoutUser, loadUser} = authSlice.actions;

export default authSlice.reducer;
