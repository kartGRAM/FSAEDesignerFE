import {configureStore} from '@reduxjs/toolkit';

import {authSlice} from '@app/store/reducers/auth';
import {uiSlice} from '@app/store/reducers/ui';
import {uiGeometryDesignerSlice} from '@app/store/reducers/uiGeometryDesigner';
import {uitGeometryDesignerSlice} from '@app/store/reducers/uiTempGeometryDesigner';
import {dataGeometryDesignerSlice} from '@app/store/reducers/dataGeometryDesigner';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {createLogger} from 'redux-logger';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {save, load} from 'redux-localstorage-simple';
import undoable from 'redux-undo';

const uigd = undoable(uiGeometryDesignerSlice.reducer, {
  undoType: 'GD_UNDO',
  redoType: 'GD_REDO'
});

const dgd = undoable(
  dataGeometryDesignerSlice.reducer /* , {
  undoType: 'GD_UNDO',
  redoType: 'GD_REDO'
} */
);

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
    uitgd: uitGeometryDesignerSlice.reducer,
    // uigd: uiGeometryDesignerSlice.reducer,
    uigd,
    dgd
  },

  preloadedState: load({
    states: ['uigd'],
    namespace: 'FSAEDesigner'
  }),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  middleware: (getDefaultMiddleware) => [
    // ...getDefaultMiddleware().concat(createLogger()),
    ...getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'dataGeometryDesigner/updateAssembly',
          'dataGeometryDesigner/newAssembly',
          'uitGeometryDesigner/setAssembly',
          'uitGeometryDesigner/setCollectedAssembly',
          'uitGeometryDesigner/setKinematicSolver',
          'uitGeometryDesigner/setGDSceneGetThree',
          'uitGeometryDesigner/setSelectedPoint',
          'uitGeometryDesigner/setViewDirection',
          'uitGeometryDesigner/setCfepOnSelected',
          'uitGeometryDesigner/setCopyFromExistingPointsDialogProps',
          'uitGeometryDesigner/setMovePointDialogProps',
          'uitGeometryDesigner/setMovePointOnMoved',
          'uitGeometryDesigner/setSaveAsDialogProps',
          'uitGeometryDesigner/setConfirmDialogProps'
        ],
        ignoredPaths: [
          `uitgd.assembly`,
          `uitgd.kinematicSolver`,
          'uitgd.collectedAssembly',
          'uitgd.gdSceneState.selectedPoint',
          'uitgd.gdSceneState.get',
          'uitgd.gdSceneState.viewDirection',
          'uitgd.gdDialogState.copyFromExistingPointsDialogProps',
          'uitgd.gdDialogState.copyFromExistingPointsOnSelected',
          'uitgd.gdDialogState.movePointDialogProps',
          'uitgd.gdDialogState.movePointOnMoved',
          'uitgd.gdDialogState.confirmDialogProps'
        ],
        warnAfter: 128
      },
      immutableCheck: {warnAfter: 128}
    }).concat(
      save({
        states: ['uigd'],
        namespace: 'FSAEDesigner'
      })
    )
  ]
});

export type RootState = ReturnType<typeof store.getState>;

export default store;
