/* eslint-disable class-methods-use-this */
import {Matrix} from 'ml-matrix';
import {ResetOptions} from './IComputationNode';

export abstract class ComputationNodeBase {
  resetKey = 0;

  storedValue: Matrix | undefined;

  _reset: (options: ResetOptions) => void = () => {};

  reset(options: ResetOptions) {
    if (options.variablesOnly && !options.resetKey) throw new Error('idが必要');
    if (!options.variablesOnly || !options.resetKey) {
      this.storedValue = undefined;
      if (!options.resetKey || options.resetKey === -1) {
        this.resetKey += 1 % 10000;
        options.resetKey = this.resetKey;
      } else {
        this.resetKey = options.resetKey;
      }
    } else if (options.resetKey && this.resetKey !== options.resetKey) {
      this.storedValue = undefined;
      this.resetKey = options.resetKey;
    }
    this._reset(options);
    return this.resetKey;
  }
}
