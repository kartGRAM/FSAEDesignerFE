import {GDState} from '@store/reducers/dataGeometryDesigner';
import {ISnapshot} from '@gd/kinematics/ISnapshot';

export interface FromParent {
  testID: string;
  nodeFrom?: string;
  initialSnapshot?: ISnapshot;
  state: GDState;
}

export type WorkerMessage = {
  isMessage: true;
  message: string;
};

export function isWorkerMessage(object: any): object is WorkerMessage {
  if (object.isMessage) return true;
  return false;
}

export type CaseResults = {
  isCaseResluts: true;
  caseResults: {[index: string]: ISnapshot[]};
};

export function isCaseResults(object: any): object is CaseResults {
  if (object.isCaseResults) return true;
  return false;
}

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

export function log(message: string) {
  const m: WorkerMessage = {isMessage: true, message};
  ctx.postMessage(m);
}
