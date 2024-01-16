import {configureStore} from '@reduxjs/toolkit';
import {authSlice} from '@app/store/reducers/auth';
import {uiSlice} from '@app/store/reducers/ui';
import {uiGeometryDesignerSlice} from '@app/store/reducers/uiGeometryDesigner';
import {uitGeometryDesignerSlice} from '@app/store/reducers/uiTempGeometryDesigner';
import {dataGeometryDesignerSlice} from '@app/store/reducers/dataGeometryDesigner';
// import {createLogger} from 'redux-logger';
import {save, load} from 'redux-localstorage-simple';
import undoable from 'redux-undo';
import {inWorker} from '@utils/helpers';

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
  preloadedState: !inWorker()
    ? load({
        states: ['uigd'],
        namespace: 'FSAEDesigner'
      })
    : undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  middleware: (getDefaultMiddleware) => [
    // ...getDefaultMiddleware().concat(createLogger()),
    ...getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'dataGeometryDesigner/updateAssembly',
          'dataGeometryDesigner/newAssembly',
          'uitGeometryDesigner/setAssemblyAndCollectedAssembly',
          'uitGeometryDesigner/setDatumManager',
          'uitGeometryDesigner/setMeasureToolsManager',
          'uitGeometryDesigner/setROVariablesManager',
          'uitGeometryDesigner/setMeasureElementPointSetterCallback',
          'uitGeometryDesigner/setKinematicsSolver',
          'uitGeometryDesigner/setGDSceneGetThree',
          'uitGeometryDesigner/setSelectedPoint',
          'uitGeometryDesigner/setViewDirection',
          'uitGeometryDesigner/setCfepOnSelected',
          'uitGeometryDesigner/setCopyFromExistingPointsDialogProps',
          'uitGeometryDesigner/setMovePointDialogProps',
          'uitGeometryDesigner/setMovePointOnMoved',
          'uitGeometryDesigner/setSaveAsDialogProps',
          'uitGeometryDesigner/setTest',
          'uitGeometryDesigner/removeTest',
          'uitGeometryDesigner/setDraggingNewTestFlowNode',
          'uitGeometryDesigner/saveTestLocalState',
          'uitGeometryDesigner/testUpdateNotify',
          'uitGeometryDesigner/setConfirmDialogProps'
        ],
        ignoredPaths: [
          `uitgd.assembly`,
          `uitgd.KinematicsSolver`,
          'uitgd.collectedAssembly',
          'uitgd.datumManager',
          `uitgd.measureToolsManager`,
          'uitgd.roVariablesManager',
          'uitgd.tests',
          'uitgd.gdSceneState.selectedPoint',
          'uitgd.gdSceneState.measureElementPointSetterCallback',
          'uitgd.gdSceneState.get',
          'uitgd.gdSceneState.viewDirection',
          'uitgd.gdDialogState.copyFromExistingPointsDialogProps',
          'uitgd.gdDialogState.copyFromExistingPointsOnSelected',
          'uitgd.gdDialogState.movePointDialogProps',
          'uitgd.gdDialogState.movePointOnMoved',
          'uitgd.draggingNewTestFlowNode',
          'uitgd.gdDialogState.saveAsDialogProps.onClose',
          'uitgd.gdDialogState.confirmDialogProps'
        ],
        warnAfter: 256
      },
      immutableCheck: {warnAfter: 256}
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
