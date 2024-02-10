import {Matrix} from 'ml-matrix';
import {RetType} from './IComputationNode';
import {IVector3} from './IVector3';
import {Vector3Base} from './Vector3Base';

export class Vector3 extends Vector3Base implements IVector3 {
  _value: () => RetType;

  _diff: (mat: Matrix) => void;

  constructor(value: () => RetType) {
    super();
    this._value = value;
    this._diff = () => {};
  }

  get value() {
    const {value, diff} = this._value();
    this._diff = diff;
    if (value.rows !== 3 && value.columns !== 1)
      throw new Error('3次元ベクトルじゃない');
    return value;
  }

  diff(fromLhs: Matrix): void {
    this._diff(fromLhs);
  }
}
