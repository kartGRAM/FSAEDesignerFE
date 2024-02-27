import {GDState} from '@store/reducers/dataGeometryDesigner';
import {ISnapshot} from '@gd/analysis/ISnapshot';
import {isObject} from '@utils/helpers';
import {IDataParameterSetter} from '@gd/analysis/ParameterSetter';

export interface FromParent {
  testID: string;
  nodeFrom: string;
  initialSnapshot?: ISnapshot;
  state: GDState;
}

export interface FromParentSweepWorker {
  step: number;
  testID: string;
  initialSnapshot?: ISnapshot;
  state: GDState;
  setters: IDataParameterSetter[];
}

export type WorkerMessage = {
  isMessage: true;
  message: string;
};

export function isWorkerMessage(object: any): object is WorkerMessage {
  return isObject(object) && object.isMessage;
}

export type CaseResults = {
  isCaseResults: true;
  cases: {
    [index: string]: {
      name: string;
      results: Required<ISnapshot>[];
    };
  };
};

export function isCaseResults(object: any): object is CaseResults {
  return isObject(object) && object.isCaseResults;
}

export type SweepResults = {
  isSweepResults: true;
  step: number;
  results: Required<ISnapshot>[];
};

export function isSweepResults(object: any): object is SweepResults {
  return isObject(object) && object.isSweepResults;
}

export type DoneProgress = {
  isDone: true;
  nodeID: string;
};
export function isDoneProgress(object: any): object is DoneProgress {
  return isObject(object) && object.isDone;
}

export type ErrorOccurred = {
  isError: true;
  nodeID: string;
};
export function isErrorOccurred(object: any): object is ErrorOccurred {
  return isObject(object) && object.isError;
}

export type WorkInProgress = {
  isWIP: true;
};

export function isWIP(object: any): object is WorkInProgress {
  return isObject(object) && object.isWIP;
}

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

export function log(message: string) {
  const m: WorkerMessage = {isMessage: true, message};
  ctx.postMessage(m);
}

export function done(nodeID: string) {
  const done: DoneProgress = {isDone: true, nodeID};
  ctx.postMessage(done);
}

export function wip() {
  const wip: WorkInProgress = {isWIP: true};
  ctx.postMessage(wip);
}

export function informError(nodeID: string) {
  const error: ErrorOccurred = {isError: true, nodeID};
  ctx.postMessage(error);
}

export const throwError = (e: any) => {
  setTimeout(() => {
    throw e.stack;
  });
};
