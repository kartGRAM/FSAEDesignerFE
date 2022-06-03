import {configureStore} from '@reduxjs/toolkit';

import {authSlice} from '@app/store/reducers/auth';
import {uiSlice} from '@app/store/reducers/ui';
import {uiGeometryDesignerSlice} from '@app/store/reducers/uiGeometryDesigner';
import {uitGeometryDesignerSlice} from '@app/store/reducers/uiTempGeometryDesigner';
import {dataGeometryDesignerSlice} from '@app/store/reducers/dataGeometryDesigner';
import {createLogger} from 'redux-logger';

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
    uitgd: uitGeometryDesignerSlice.reducer,
    uigd: uiGeometryDesignerSlice.reducer,
    dgd: dataGeometryDesignerSlice.reducer
  },
  middleware: (getDefaultMiddleware) => [
    ...getDefaultMiddleware().concat(createLogger())
  ]
});

export type RootState = ReturnType<typeof store.getState>;

export default store;
