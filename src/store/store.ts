import {configureStore} from '@reduxjs/toolkit';

import {authSlice} from '@app/store/reducers/auth';
import {uiSlice} from '@app/store/reducers/ui';
import {uiGeometryDesignerSlice} from '@app/store/reducers/uiGeometryDesigner';
import {uitGeometryDesignerSlice} from '@app/store/reducers/uiTempGeometryDesigner';
import {dataGeometryDesignerSlice} from '@app/store/reducers/dataGeometryDesigner';
// eslint-disable-next-line no-unused-vars
import {createLogger} from 'redux-logger';
import {save, load} from 'redux-localstorage-simple';

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
    uitgd: uitGeometryDesignerSlice.reducer,
    uigd: uiGeometryDesignerSlice.reducer,
    dgd: dataGeometryDesignerSlice.reducer
  },
  preloadedState: load({
    states: ['uigd'],
    namespace: 'FSAEDesigner'
  }),
  middleware: (getDefaultMiddleware) => [
    // ...getDefaultMiddleware().concat(createLogger()),
    ...getDefaultMiddleware().concat(
      save({
        states: ['uigd'],
        namespace: 'FSAEDesigner'
      })
    )
  ]
});

export type RootState = ReturnType<typeof store.getState>;

export default store;
