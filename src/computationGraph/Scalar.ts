/* eslint-disable camelcase */
/* eslint-disable max-classes-per-file */
import {Matrix} from 'ml-matrix';
import {isNumber} from '@utils/helpers';
import {RetType, ResetOptions} from './IComputationNode';
import {IScalar} from './IScalar';
import {isConstant} from './IConstant';
import {ComputationNodeBase} from './ComputationNodeBase';

export abstract class ScalarBase extends ComputationNodeBase {
  readonly isScalar = true;

  abstract get value(): Matrix;

  get scalarValue() {
    return this.value.get(0, 0);
  }

  abstract diff(fromLhs: Matrix): void;

  abstract setJacobian(phi_q: Matrix, row: number): void;

  constructor(reset: (options: ResetOptions) => void) {
    super();
    this._reset = reset;
  }

  mul(other: IScalar | number) {
    return new Scalar(
      () => {
        const lhs = this.value; // (1x1)
        const rhs = isNumber(other) ? other : other.scalarValue; // (1x1)
        return {
          value: () => lhs.clone().mul(rhs),
          diff: (mat: Matrix) => {
            if (!isConstant(this)) this.diff(mat.clone().mul(rhs));
            if (!isNumber(other) && !isConstant(other))
              other.diff(mat.mmul(lhs));
          }
        };
      },
      (options) => {
        this.reset(options);
        if (!isNumber(other) && !isConstant(other)) other.reset(options);
      },
      (phi_q, row) => {
        this.setJacobian(phi_q, row);
        if (!isNumber(other) && !isConstant(other))
          other.setJacobian(phi_q, row);
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
          value: () => lhs.clone().mul(1 / rhs),
          diff: (mat: Matrix) => {
            if (!isConstant(this)) this.diff(mat.clone().mul(1 / rhs));
            if (!isNumber(other) && !isConstant(other))
              other.diff(mat.mmul(lhs).mul(-1 / rhs2));
          }
        };
      },
      (options) => {
        this.reset(options);
        if (!isNumber(other) && !isConstant(other)) other.reset(options);
      },
      (phi_q, row) => {
        this.setJacobian(phi_q, row);
        if (!isNumber(other) && !isConstant(other))
          other.setJacobian(phi_q, row);
      }
    );
  }

  add(other: IScalar | number) {
    return new Scalar(
      () => {
        const lhs = this.value; // (1x1)
        const rhs = isNumber(other) ? Matrix.eye(1, 1).mul(other) : other.value; // (1x1)
        return {
          value: () => lhs.add(rhs),
          diff: (mat: Matrix) => {
            if (!isConstant(this)) this.diff(mat);
            if (!isNumber(other) && !isConstant(other)) other.diff(mat);
          }
        };
      },
      (options) => {
        this.reset(options);
        if (!isNumber(other) && !isConstant(other)) other.reset(options);
      },
      (phi_q, row) => {
        this.setJacobian(phi_q, row);
        if (!isNumber(other) && !isConstant(other))
          other.setJacobian(phi_q, row);
      }
    );
  }

  sub(other: IScalar | number) {
    return new Scalar(
      () => {
        const lhs = this.value; // (1x1)
        const rhs = isNumber(other) ? Matrix.eye(1, 1).mul(other) : other.value; // (1x1)
        return {
          value: () => lhs.sub(rhs),
          diff: (mat: Matrix) => {
            if (!isConstant(this)) this.diff(mat);
            if (!isNumber(other) && !isConstant(other))
              other.diff(mat.clone().mul(-1));
          }
        };
      },
      (options) => {
        this.reset(options);
        if (!isNumber(other) && !isConstant(other)) other.reset(options);
      },
      (phi_q, row) => {
        this.setJacobian(phi_q, row);
        if (!isNumber(other) && !isConstant(other))
          other.setJacobian(phi_q, row);
      }
    );
  }
}

export class Scalar extends ScalarBase implements IScalar {
  _value: () => RetType;

  _diff: (mat: Matrix) => void;

  _setJacobian: (phi_q: Matrix, row: number) => void;

  constructor(
    value: () => RetType,
    reset: (options: ResetOptions) => void,
    setJacobian: (phi_q: Matrix, row: number) => void
  ) {
    super(reset);
    this._setJacobian = setJacobian;
    this._value = value;
    this._diff = () => {};
  }

  get value() {
    if (this.storedValue) return this.storedValue;
    const {value, diff} = this._value();
    this._diff = diff;
    this.storedValue = value();
    if (this.storedValue.rows !== 1 && this.storedValue.columns !== 1)
      throw new Error('スカラーじゃない');
    return this.storedValue;
  }

  diff(fromLhs: Matrix): void {
    this._diff(fromLhs);
  }

  setJacobian(phi_q: Matrix, row: number): void {
    this._setJacobian(phi_q, row);
  }
}
