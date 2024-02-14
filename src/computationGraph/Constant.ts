import {Matrix} from 'ml-matrix';
import {IConstant} from './IConstant';

export class Constant implements IConstant {
  readonly isConstant = true;

  readonly value: Matrix;

  // eslint-disable-next-line class-methods-use-this
  diff(): void {}

  // eslint-disable-next-line class-methods-use-this
  reset(): void {}

  // eslint-disable-next-line class-methods-use-this
  setJacobian() {}

  constructor(value: Matrix) {
    this.value = value;
  }
}
