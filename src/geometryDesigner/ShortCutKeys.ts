// eslint-disable-next-line @typescript-eslint/no-unused-vars
import store from '@store/store';
import {ActionCreators} from 'redux-undo';
import {instance} from '@app/utils/axios';
import saveAs from '@gd/SaveAs';
import {AxiosRequestConfig, AxiosPromise} from 'axios';
import {RefetchOptions} from 'axios-hooks';
import {Quaternion, Spherical} from 'three';
import {
  selectElement,
  setSelectedPoint,
  setViewDirection,
  setCopyFromExistingPointsDialogProps,
  setSelectedMeasureTool,
  setSelectedDatumObject,
  setMovingMode
} from '@store/reducers/uiTempGeometryDesigner';
import {getCameraQuaternion} from '@utils/three';

export default function shortCutKeys(e: KeyboardEvent) {
  const state = store.getState();
  if (state.uitgd.uiDisabledAll) return;
  if (e.key === 'F8') {
    const {get} = state.uitgd.gdSceneState;
    if (get) {
      const {camera} = get();
      const qc = camera.quaternion;
      let maxNorm = Number.MIN_SAFE_INTEGER;
      let q: Quaternion | null = null;
      directions.forEach((direction) => {
        const norm = qc.dot(direction);
        if (maxNorm < norm) {
          maxNorm = norm;
          q = direction.clone();
        }
      });
      if (q) {
        store.dispatch(setViewDirection(q));
        e.preventDefault();
      }
    }
  }
  if (e.key === 'F7') {
    const {get} = state.uitgd.gdSceneState;
    if (get) {
      const {camera} = get();
      const qc = camera.quaternion;
      store.dispatch(setViewDirection(qc.clone()));
      e.preventDefault();
    }
  }

  const controllerKeys = state.dgd.present.controls
    .filter((c) => c.type === 'keyboard')
    .map((c) => c.inputButton);
  const orbitControlKeys = ['F4', 'F5', 'F6'];
  if (controllerKeys.includes(e.key) || orbitControlKeys.includes(e.key)) {
    if (!e.key.includes('Arrow')) e.preventDefault();
    return;
  }
  if (state.uitgd.uiDisabled) return;

  if (e.ctrlKey) {
    if (e.key === 'z') store.dispatch(ActionCreators.undo());
    else if (e.key === 'y') store.dispatch(ActionCreators.redo());
    else if (e.key === 's') {
      e.preventDefault();
      const func = (
        config?: AxiosRequestConfig<any> | undefined,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        options?: RefetchOptions | undefined
      ): AxiosPromise<any> => {
        return instance.post('/api/gd/save_as/', config?.data, config);
      };
      saveAs({
        dispatch: store.dispatch,
        overwrite: true,
        updateDataFuncAxiosHooks: func
      });
    }
    /* else if (e.key === 'c') {
      console.log('ctrl-c');
      // e.preventDefault();
    } else if (e.key === 'x') {
      console.log('ctrl-x');
      // e.preventDefault();
    } else if (e.key === 'v') {
      console.log('ctrl-v');
      // e.preventDefault();
    } */
  }
  if (e.key === 'Escape') {
    if (state.uitgd.gdDialogState.copyFromExistingPointsDialogProps.open) {
      store.dispatch(
        setCopyFromExistingPointsDialogProps({open: false, onSelected: null})
      );
      return;
    }
    if (state.uitgd.gdSceneState.movingMode) {
      store.dispatch(setMovingMode(false));
      return;
    }
    if (state.uitgd.gdSceneState.selectedDatumObject) {
      store.dispatch(setSelectedDatumObject(''));
      return;
    }
    if (state.uitgd.gdSceneState.selectedMeasureTool) {
      store.dispatch(setSelectedMeasureTool(''));
      return;
    }
    store.dispatch(selectElement({absPath: '', cancelTabChange: true}));
    store.dispatch(setSelectedPoint(null));
  }
}

const directions = [
  // Bottom
  getCameraQuaternion(new Spherical(1, Math.PI, 0)),
  getCameraQuaternion(new Spherical(1, Math.PI, 0)).conjugate(),
  // Front
  new Quaternion(0, 0, 0, 1),
  // Left
  new Quaternion(0, -Math.sqrt(2) / 2, 0, Math.sqrt(2) / 2),
  new Quaternion(0, Math.sqrt(2) / 2, 0, Math.sqrt(2) / 2),
  // Rear
  new Quaternion(0, 1, 0, 0),
  new Quaternion(0, -1, 0, 0),
  // Right
  new Quaternion(0, Math.sqrt(2) / 2, 0, Math.sqrt(2) / 2),
  new Quaternion(0, -Math.sqrt(2) / 2, 0, Math.sqrt(2) / 2),
  // Top
  getCameraQuaternion(new Spherical(1, 0, 0)),
  getCameraQuaternion(new Spherical(1, 0, 0)).conjugate(),
  // OtherTop Or Bottom
  // ジンバルロックを避けるためgetCameraQuaternionを使用する
  getCameraQuaternion(new Spherical(1, 0, Math.PI / 2)),
  getCameraQuaternion(new Spherical(1, 0, Math.PI / 2)).conjugate(),
  getCameraQuaternion(new Spherical(1, 0, Math.PI)),
  getCameraQuaternion(new Spherical(1, 0, Math.PI)).conjugate(),
  getCameraQuaternion(new Spherical(1, 0, Math.PI * 1.5)),
  getCameraQuaternion(new Spherical(1, 0, Math.PI * 1.5)).conjugate(),
  getCameraQuaternion(new Spherical(1, Math.PI, Math.PI / 2)),
  getCameraQuaternion(new Spherical(1, Math.PI, Math.PI / 2)).conjugate(),
  getCameraQuaternion(new Spherical(1, Math.PI, Math.PI)),
  getCameraQuaternion(new Spherical(1, Math.PI, Math.PI)).conjugate(),
  getCameraQuaternion(new Spherical(1, Math.PI, Math.PI * 1.5)),
  getCameraQuaternion(new Spherical(1, Math.PI, Math.PI * 1.5)).conjugate()
];
