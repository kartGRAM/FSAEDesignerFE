/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import {ITireData} from '@tire/ITireData';
import {Vector3} from 'three';

export const defaultSlickTireNodeID = 'defaultSlickTire' as const;
export class DefaultSlickTire implements ITireData {
  nodeID = defaultSlickTireNodeID;

  name = 'defaultSlickTire';

  description = 'デフォルトのスリックタイヤ';

  friction(params: {sa: number; sl: number; ia: number; fz: number}) {
    const {sa, sl, ia, fz} = params;
    return new Vector3(sl * fz * 0.4, -sa * fz * 0.36, 0);
  }

  dF_dSa(params: {sa: number; sl: number; ia: number; fz: number}) {
    const {sa, sl, ia, fz} = params;
    return new Vector3(0, -fz * 0.36, 0);
  }

  dF_dSl(params: {sa: number; sl: number; ia: number; fz: number}) {
    const {sa, sl, ia, fz} = params;
    return new Vector3(fz * 0.4, 0, 0);
  }

  dF_dIa(params: {sa: number; sl: number; ia: number; fz: number}) {
    const {sa, sl, ia, fz} = params;
    return new Vector3(0, 0, 0);
  }

  dF_dFz(params: {sa: number; sl: number; ia: number; fz: number}) {
    const {sa, sl, ia, fz} = params;
    return new Vector3(sl * 0.4, -sa * 0.36, 0);
  }

  mz(params: {sa: number; sl: number; ia: number; fz: number}) {
    const {sa, sl, ia, fz} = params;
    return 0;
  }

  dMz_dSa(params: {sa: number; sl: number; ia: number; fz: number}): number {
    return 0;
  }

  dMz_dSl(params: {sa: number; sl: number; ia: number; fz: number}): number {
    return 0;
  }

  dMz_dIa(params: {sa: number; sl: number; ia: number; fz: number}): number {
    return 0;
  }

  dMz_dFz(params: {sa: number; sl: number; ia: number; fz: number}): number {
    return 0;
  }
}
