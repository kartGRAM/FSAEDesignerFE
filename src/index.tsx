import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {toast} from 'react-toastify';
import App from '@app/App';
import store from '@store/store';

import './i18n';
import * as serviceWorker from './serviceWorker';

import './index.css';

toast.configure({
  autoClose: 3000,
  draggable: false,
  position: 'top-right',
  hideProgressBar: false,
  newestOnTop: true,
  closeOnClick: true,
  rtl: false,
  pauseOnHover: true
});

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
