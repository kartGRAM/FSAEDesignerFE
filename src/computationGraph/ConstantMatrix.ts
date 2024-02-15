import {Matrix} from 'ml-matrix';
import {IConstant} from './IConstant';
import {IMatrix} from './IMatrix';
import {MatrixBase} from './Matrix';

export class ConstantMatrix extends MatrixBase implements IMatrix, IConstant {
  readonly isConstant = true;

  value: Matrix;

  // eslint-disable-next-line class-methods-use-this
  diff(): void {}

  // eslint-disable-next-line class-methods-use-this
  reset() {
    return -1;
  }

  // eslint-disable-next-line class-methods-use-this
  setJacobian() {}

  setValue(value: Matrix) {
    this.value = value;
  }

  constructor(value: Matrix) {
    super(() => {});
    this.value = value;
  }
}
