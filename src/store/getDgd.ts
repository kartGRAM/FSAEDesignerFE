import wStore from '@store/workerStore';
import mStore from '@store/store';
import {inWorker} from '@utils/helpers';

export const getDgd = () =>
  inWorker() ? wStore.getState().dgd : mStore.getState().dgd.present;

export const dispatch = inWorker() ? wStore.dispatch : mStore.dispatch;

export const store = inWorker() ? wStore : mStore;
