import {Matrix as MLMatrix} from 'ml-matrix';
import {isNumber} from '@utils/helpers';
import {RetType} from './IComputationNode';
import {IScalar} from './IScalar';
import {IVector3} from './IVector3';
import {Vector3} from './Vector3';
import {IMatrix} from './IMatrix';

export class Matrix implements IMatrix {
  readonly isMatrix = true;

  _value: () => RetType;

  _diff: (fromLhs: MLMatrix, fromRhs?: MLMatrix) => void;

  constructor(value: () => RetType) {
    this._value = value;
    this._diff = () => {};
  }

  get value() {
    const {value, diff} = this._value();
    this._diff = diff;
    return value;
  }

  diff(fromLhs: MLMatrix, fromRhs?: MLMatrix): void {
    this._diff(fromLhs, fromRhs);
  }

  mul(other: IScalar | number) {
    return new Matrix(() => {
      const lhs = this.value; // (nxm)
      const rhs = isNumber(other) ? other : other.scalarValue; // (1x1)
      return {
        value: lhs.clone().mul(rhs), // (nxm)
        diff: (fromLhs: MLMatrix, fromRhs?: MLMatrix) => {
          this.diff(fromLhs.clone().mul(rhs), fromRhs);
          if (!isNumber(other)) {
            if (fromRhs) {
              other.diff(fromLhs.mmul(lhs).mmul(fromRhs));
            } else {
              other.diff(fromLhs.mmul(lhs));
            }
          }
        }
      };
    });
  }

  mmul(other: IMatrix) {
    return new Matrix(() => {
      const lhs = this.value; // (mxn)
      const rhs = other.value; // (nxk)
      return {
        value: lhs.mmul(rhs), // (mxk)
        diff: (fromLhs: MLMatrix, fromRhs?: MLMatrix) => {
          this.diff(fromLhs, fromRhs ? rhs.mmul(fromRhs) : rhs);
          other.diff(fromLhs.mmul(lhs));
        }
      };
    });
  }

  vmul(other: IVector3) {
    return new Vector3(() => {
      const lhs = this.value; // (mx3)
      const rhs = other.value; // (3x1)
      return {
        value: lhs.mmul(rhs), // (3x1)
        diff: (fromLhs: MLMatrix) => {
          this.diff(fromLhs, rhs);
          other.diff(fromLhs.mmul(lhs));
        }
      };
    });
  }
}
