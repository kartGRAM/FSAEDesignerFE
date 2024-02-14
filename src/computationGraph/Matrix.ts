import {Matrix as MLMatrix} from 'ml-matrix';
import {isNumber} from '@utils/helpers';
import {RetType, ResetOptions} from './IComputationNode';
import {IScalar} from './IScalar';
import {IVector3} from './IVector3';
import {Vector3} from './Vector3';
import {IMatrix} from './IMatrix';
import {isConstant} from './IConstant';

export class Matrix implements IMatrix {
  readonly isMatrix = true;

  _value: () => RetType;

  _diff: (fromLhs: MLMatrix, fromRhs?: MLMatrix) => void;

  _reset: (options: ResetOptions) => void;

  storedValue: MLMatrix | undefined;

  constructor(value: () => RetType, reset: (options: ResetOptions) => void) {
    this._value = value;
    this._diff = () => {};
    this._reset = reset;
  }

  get value() {
    if (this.storedValue) return this.storedValue;
    const {value, diff} = this._value();
    this.storedValue = value();
    this._diff = diff;
    return this.storedValue;
  }

  reset(options: ResetOptions) {
    if (!options.variablesOnly) this.storedValue = undefined;
    this._reset(options);
  }

  diff(fromLhs: MLMatrix, fromRhs?: MLMatrix): void {
    this._diff(fromLhs, fromRhs);
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
      }
    );
  }
}
