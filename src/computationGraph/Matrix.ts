/* eslint-disable max-classes-per-file */
/* eslint-disable camelcase */
import {Matrix as MLMatrix} from 'ml-matrix';
import {isNumber} from '@utils/helpers';
import {RetType, ResetOptions} from './IComputationNode';
import {IScalar} from './IScalar';
import {IVector3} from './IVector3';
import {Vector3} from './Vector3';
import {IMatrix} from './IMatrix';
import {isConstant} from './IConstant';
import {ComputationNodeBase} from './ComputationNodeBase';

export abstract class MatrixBase extends ComputationNodeBase {
  readonly isMatrix = true;

  abstract get value(): MLMatrix;

  abstract diff(fromLhs: MLMatrix, fromRhs?: MLMatrix): void;

  abstract setJacobian(phi_q: MLMatrix, row: number): void;

  constructor(reset: (options: ResetOptions) => void) {
    super();
    this._reset = reset;
  }

  mul(other: IScalar | number) {
    return new Matrix(
      () => {
        const lhs = this.value; // (nxm)
        const rhs = isNumber(other) ? other : other.scalarValue; // (1x1)
        return {
          value: () => lhs.clone().mul(rhs), // (nxm)
          diff: (fromLhs: MLMatrix, fromRhs?: MLMatrix) => {
            this.diff(fromLhs.clone().mul(rhs), fromRhs);
            if (!isNumber(other) && !isConstant(other)) {
              if (fromRhs) {
                other.diff(fromLhs.mmul(lhs).mmul(fromRhs));
              } else {
                other.diff(fromLhs.mmul(lhs));
              }
            }
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

  mmul(other: IMatrix) {
    return new Matrix(
      () => {
        const lhs = this.value; // (mxn)
        const rhs = other.value; // (nxk)
        return {
          value: () => lhs.mmul(rhs), // (mxk)
          diff: (fromLhs: MLMatrix, fromRhs?: MLMatrix) => {
            this.diff(fromLhs, fromRhs ? rhs.mmul(fromRhs) : rhs);
            if (!isConstant(other)) other.diff(fromLhs.mmul(lhs));
          }
        };
      },
      (options) => {
        this.reset(options);
        if (!isConstant(other)) other.reset(options);
      },
      (phi_q, row) => {
        this.setJacobian(phi_q, row);
        if (!isConstant(other)) other.setJacobian(phi_q, row);
      }
    );
  }

  vmul(other: IVector3) {
    return new Vector3(
      () => {
        const lhs = this.value; // (mx3)
        const rhs = other.value; // (3x1)
        return {
          value: () => lhs.mmul(rhs), // (3x1)
          diff: (fromLhs: MLMatrix) => {
            this.diff(fromLhs, rhs);
            if (!isConstant(other)) other.diff(fromLhs.mmul(lhs));
          }
        };
      },
      (options) => {
        this.reset(options);
        if (!isConstant(other)) other.reset(options);
      },
      (phi_q, row) => {
        this.setJacobian(phi_q, row);
        if (!isConstant(other)) other.setJacobian(phi_q, row);
      }
    );
  }
}

export class Matrix extends MatrixBase implements IMatrix {
  _value: () => RetType;

  _diff: (fromLhs: MLMatrix, fromRhs?: MLMatrix) => void;

  _setJacobian: (phi_q: MLMatrix, row: number) => void;

  constructor(
    value: () => RetType,
    reset: (options: ResetOptions) => void,
    setJacobian: (phi_q: MLMatrix, row: number) => void
  ) {
    super(reset);
    this._value = value;
    this._setJacobian = setJacobian;
    this._diff = () => {};
  }

  get value() {
    if (this.storedValue) return this.storedValue;
    const {value, diff} = this._value();
    this.storedValue = value();
    this._diff = diff;
    return this.storedValue;
  }

  diff(fromLhs: MLMatrix, fromRhs?: MLMatrix): void {
    this._diff(fromLhs, fromRhs);
  }

  setJacobian(phi_q: MLMatrix, row: number): void {
    this._setJacobian(phi_q, row);
  }
}
