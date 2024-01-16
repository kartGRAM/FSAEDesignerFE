import {configureStore} from '@reduxjs/toolkit';
import {dataGeometryDesignerSlice} from '@app/store/reducers/dataGeometryDesigner';

const store = configureStore({
  reducer: {
    dgd: dataGeometryDesignerSlice.reducer
  },
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
        warnAfter: 128
      },
      immutableCheck: {warnAfter: 128}
    })
  ]
});

export type WRootState = ReturnType<typeof store.getState>;

export default store;
