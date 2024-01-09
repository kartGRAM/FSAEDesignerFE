import {ITireData} from '@tire/ITireData';
import {DefaultSlickTire, defaultSlickTireNodeID} from '@tire/DefaultSlickTire';

export const listTireData = (): string[] => {
  return [defaultSlickTireNodeID];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getTire = (nodeID: string): ITireData => {
  return new DefaultSlickTire();
};
