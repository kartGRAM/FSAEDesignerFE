import React from 'react';
import {createRoot} from 'react-dom/client';
import {Provider} from 'react-redux';
import App from '@app/App';
import store from '@store/store';

import './i18n';
import './index.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <Provider store={store}>
      <App />
    </Provider>
  );
}
