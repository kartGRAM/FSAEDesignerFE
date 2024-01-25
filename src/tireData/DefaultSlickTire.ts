import {ITireData} from '@tire/ITireData';

export const defaultSlickTireNodeID = 'defaultSlickTire' as const;
export class DefaultSlickTire implements ITireData {
  nodeID = defaultSlickTireNodeID;

  name = 'defaultSlickTire';

  description = 'デフォルトのスリックタイヤ';

  // eslint-disable-next-line class-methods-use-this
  get(params: {sa: number; sl: number; ia: number; fz: number}) {
    const {sa, sl, ia, fz} = params;
    return {fx: sl * fz * 0.4, fy: sa * fz * 0.36, mz: 0 * ia};
  }
}
