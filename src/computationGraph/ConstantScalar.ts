import {Matrix} from 'ml-matrix';
import {IConstant} from './IConstant';
import {IScalar} from './IScalar';
import {ScalarBase} from './Scalar';

export class ConstantScalar extends ScalarBase implements IScalar, IConstant {
  readonly isConstant = true;

  _value: number;

  get value() {
    return Matrix.eye(1, 1).mul(this._value);
  }

  setValue(value: number) {
    this._value = value;
  }

  get scalarValue() {
    return this._value;
  }

  // eslint-disable-next-line class-methods-use-this
  diff(): void {}

  // eslint-disable-next-line class-methods-use-this
  reset(): void {}

  // eslint-disable-next-line class-methods-use-this
  setJacobian() {}

  constructor(value: number) {
    super(() => {});
    this._value = value;
  }
}
