import {Vector3} from 'three';

export const isVector3 = (value: any): value is Vector3 => {
  try {
    return value.isVector3;
  } catch (e: any) {
    return false;
  }
};
