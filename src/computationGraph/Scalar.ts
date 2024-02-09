import {Matrix} from 'ml-matrix';
import {isNumber} from '@utils/helpers';
import {RetType} from './IComputationNode';
import {IScalar} from './IScalar';

export class Scalar implements IScalar {
  readonly isScalar = true;

  _value: () => RetType;

  _diff: (mat?: Matrix) => void;

  readonly rows: number;

  constructor(value: () => RetType, rows: number) {
    this._value = value;
    this._diff = () => {};
    this.rows = rows;
  }

  get value() {
    const {value, diff} = this._value();
    this._diff = diff;
    if (value.rows !== 1 && value.columns !== 1)
      throw new Error('スカラーじゃない');
    return value;
  }

  get scalarValue() {
    return this.value.get(0, 0);
  }

  diff(fromLhs?: Matrix): void {
    this._diff(fromLhs);
  }

  mul(other: Scalar | number) {
    return new Scalar(() => {
      const lhs = this.value; // (1x1)
      const rhs = isNumber(other) ? Matrix.eye(1, 1).mul(other) : other.value; // (1x1)
      return {
        value: lhs.mmul(rhs),
        diff: (mat?: Matrix) => {
          if (!mat) mat = Matrix.eye(1, 1);
          this.diff(mat.mmul(rhs));
          if (!isNumber(other)) other.diff(mat.mmul(lhs));
        }
      };
    }, this.rows);
  }
}
