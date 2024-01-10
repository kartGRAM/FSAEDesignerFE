import {ITireData} from '@tire/ITireData';
import {DefaultSlickTire, defaultSlickTireNodeID} from '@tire/DefaultSlickTire';

export const listTireData = (): {[index: string]: string} => {
  const list: {[index: string]: string} = {};
  list[defaultSlickTireNodeID] = 'default slick tire';
  return list;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getTire = (nodeID: string): ITireData => {
  return new DefaultSlickTire();
};
