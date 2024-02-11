/* eslint-disable max-classes-per-file */
import {Matrix} from 'ml-matrix';
import {isNumber} from '@utils/helpers';
import {RetType} from './IComputationNode';
import {IScalar} from './IScalar';
import {isConstant} from './IConstant';

export abstract class ScalarBase {
  readonly isScalar = true;

  abstract get value(): Matrix;

  get scalarValue() {
    return this.value.get(0, 0);
  }

  abstract diff(fromLhs: Matrix): void;

  abstract reset(): void;

  _reset: () => void;

  constructor(reset: () => void) {
    this._reset = reset;
  }

  mul(other: IScalar | number) {
    return new Scalar(
      () => {
        const lhs = this.value; // (1x1)
        const rhs = isNumber(other) ? other : other.scalarValue; // (1x1)
        return {
          value: lhs.clone().mul(rhs),
          diff: (mat: Matrix) => {
            if (!isConstant(this)) this.diff(mat.clone().mul(rhs));
            if (!isNumber(other) && !isConstant(other))
              other.diff(mat.mmul(lhs));
          }
        };
      },
      () => {
        this.reset();
        if (!isNumber(other) && !isConstant(other)) other.reset();
      }
    );
  }

  div(other: IScalar | number) {
    return new Scalar(
      () => {
        const lhs = this.value; // (1x1)
        const rhs = isNumber(other) ? other : other.scalarValue; // (1x1)
        const rhs2 = rhs ** 2;
        return {
          value: lhs.clone().mul(1 / rhs),
          diff: (mat: Matrix) => {
            if (!isConstant(this)) this.diff(mat.clone().mul(1 / rhs));
            if (!isNumber(other) && !isConstant(other))
              other.diff(mat.mmul(lhs).mul(-1 / rhs2));
          }
        };
      },
      () => {
        this.reset();
        if (!isNumber(other) && !isConstant(other)) other.reset();
      }
    );
  }

  add(other: IScalar | number) {
    return new Scalar(
      () => {
        const lhs = this.value; // (1x1)
        const rhs = isNumber(other) ? Matrix.eye(1, 1).mul(other) : other.value; // (1x1)
        return {
          value: lhs.add(rhs),
          diff: (mat: Matrix) => {
            if (!isConstant(this)) this.diff(mat);
            if (!isNumber(other) && !isConstant(other)) other.diff(mat);
          }
        };
      },
      () => {
        this.reset();
        if (!isNumber(other) && !isConstant(other)) other.reset();
      }
    );
  }

  sub(other: IScalar | number) {
    return new Scalar(
      () => {
        const lhs = this.value; // (1x1)
        const rhs = isNumber(other) ? Matrix.eye(1, 1).mul(other) : other.value; // (1x1)
        return {
          value: lhs.sub(rhs),
          diff: (mat: Matrix) => {
            if (!isConstant(this)) this.diff(mat);
            if (!isNumber(other) && !isConstant(other))
              other.diff(mat.clone().mul(-1));
          }
        };
      },
      () => {
        this.reset();
        if (!isNumber(other) && !isConstant(other)) other.reset();
      }
    );
  }
}

export class Scalar extends ScalarBase implements IScalar {
  _value: () => RetType;

  _diff: (mat: Matrix) => void;

  storedValue: Matrix | undefined;

  constructor(value: () => RetType, reset: () => void) {
    super(reset);
    this._value = value;
    this._diff = () => {};
  }

  reset() {
    this.storedValue = undefined;
    this._reset();
  }

  get value() {
    if (this.storedValue) return this.storedValue;
    const {value, diff} = this._value();
    this._diff = diff;
    this.storedValue = value;
    if (value.rows !== 1 && value.columns !== 1)
      throw new Error('スカラーじゃない');
    return value;
  }

  diff(fromLhs: Matrix): void {
    this._diff(fromLhs);
  }
}
