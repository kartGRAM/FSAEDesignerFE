/* eslint-disable class-methods-use-this */
import {ITireData, TireRes} from '@tire/ITireData';

export const defaultSlickTireNodeID = 'defaultSlickTire' as const;
export class DefaultSlickTire implements ITireData {
  nodeID = defaultSlickTireNodeID;

  name = 'defaultSlickTire';

  description = 'デフォルトのスリックタイヤ';

  // 0.36
  get(params: {sa: number; sl: number; ia: number; fz: number}) {
    const {sa, sl, ia, fz} = params;
    return {fx: sl * fz * 0.4, fy: -sa * fz * 0.16, mz: 0 * ia};
  }

  saDiff(params: {sa: number; sl: number; ia: number; fz: number}): TireRes {
    const {fz} = params;
    return {fx: 0, fy: -fz * 0.16, mz: 0};
  }

  fzDiff(params: {sa: number; sl: number; ia: number; fz: number}): TireRes {
    const {sa, sl} = params;
    return {fx: sl * 0.4, fy: -sa * 0.16, mz: 0};
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  iaDiff(params: {sa: number; sl: number; ia: number; fz: number}): TireRes {
    return {fx: 0, fy: 0, mz: 0};
  }
}
