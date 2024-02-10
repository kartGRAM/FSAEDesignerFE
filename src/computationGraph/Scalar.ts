/* eslint-disable max-classes-per-file */
import {Matrix} from 'ml-matrix';
import {isNumber} from '@utils/helpers';
import {RetType} from './IComputationNode';
import {IScalar} from './IScalar';
import {isConstant} from './IConstant';

export abstract class ScalarBase {
  readonly isScalar = true;

  abstract get value(): Matrix;

  abstract diff(fromLhs: Matrix): void;

  mul(other: Scalar | number) {
    return new Scalar(() => {
      const lhs = this.value; // (1x1)
      const rhs = isNumber(other) ? Matrix.eye(1, 1).mul(other) : other.value; // (1x1)
      return {
        value: lhs.mmul(rhs),
        diff: (mat?: Matrix) => {
          if (!mat) mat = Matrix.eye(1, 1);
          if (!isConstant(this)) this.diff(mat.mmul(rhs));
          if (!isNumber(other) && !isConstant(other)) other.diff(mat.mmul(lhs));
        }
      };
    });
  }

  add(other: Scalar | number) {
    return new Scalar(() => {
      const lhs = this.value; // (1x1)
      const rhs = isNumber(other) ? Matrix.eye(1, 1).mul(other) : other.value; // (1x1)
      return {
        value: lhs.add(rhs),
        diff: (mat?: Matrix) => {
          if (!mat) mat = Matrix.eye(1, 1);
          if (!isConstant(this)) this.diff(mat);
          if (!isNumber(other) && !isConstant(other)) other.diff(mat);
        }
      };
    });
  }

  sub(other: Scalar | number) {
    return new Scalar(() => {
      const lhs = this.value; // (1x1)
      const rhs = isNumber(other) ? Matrix.eye(1, 1).mul(other) : other.value; // (1x1)
      return {
        value: lhs.sub(rhs),
        diff: (mat?: Matrix) => {
          if (!mat) mat = Matrix.eye(1, 1);
          if (!isConstant(this)) this.diff(mat);
          if (!isNumber(other) && !isConstant(other))
            other.diff(mat.clone().mul(-1));
        }
      };
    });
  }
}

export class Scalar extends ScalarBase implements IScalar {
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
    if (value.rows !== 1 && value.columns !== 1)
      throw new Error('スカラーじゃない');
    return value;
  }

  get scalarValue() {
    return this.value.get(0, 0);
  }

  diff(fromLhs: Matrix): void {
    this._diff(fromLhs);
  }
}
