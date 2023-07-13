// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {sleep, inWorker} from '@utils/helpers';
import store from '@store/workerStore';
import {replaceState, GDState} from '@store/reducers/dataGeometryDesigner';

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

ctx.onmessage = async (e) => {
  const state = e.data as GDState;
  await store.dispatch(replaceState(state));

  ctx.postMessage(`WorkerStart: ${e.data}`);
  ctx.postMessage('WorkerEnd');
};
