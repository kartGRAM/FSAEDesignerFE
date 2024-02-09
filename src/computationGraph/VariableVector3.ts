import {Matrix} from 'ml-matrix';
import {isNumber} from '@utils/helpers';
import {IVector3} from './IVector3';
import {Scalar} from './Scalar';
import {IScalar} from './IScalar';
import {isConstant} from './IConstant';
import {Vector3} from './Vector3';
import {skew, getVVector, Vector3Like} from './Functions';

export class VariableVector3 implements IVector3 {
  readonly isVector3 = true;

  _value: Matrix;

  _diff: Matrix;

  rows: number;

  setValue(value: Vector3Like) {
    this._value = getVVector(value);
  }

  constructor(rows: number) {
    this._value = new Matrix(3, 1);
    this.rows = rows;
    this._diff = new Matrix(rows, 3);
  }

  get value() {
    this._diff = new Matrix(this.rows, 3);
    return this._value;
  }

  diff(mat: Matrix): void {
    this._diff.add(mat);
  }

  mul(other: IScalar | number) {
    return new Vector3(() => {
      const lhs = this.value; // (3x1)
      const rhs = isNumber(other) ? Matrix.eye(1, 1).mul(other) : other.value; // (1x1)
      return {
        value: lhs.clone().mul(rhs), // (3x1)
        diff: (mat?: Matrix) => {
          if (this.rows === 3 && !mat) mat = Matrix.eye(3, 3);
          else if (!mat) throw new Error('rowsが3以外では、matが必要');
          this.diff(mat.clone().mul(rhs)); // (row x 3)
          if (!isNumber(other)) other.diff(mat.mmul(lhs)); // (3x1)
        }
      };
    }, this.rows);
  }

  dot(other: IVector3) {
    return new Scalar(() => {
      const lhs = this.value; // (3x1)
      const rhs = other.value; // (3x1)
      const lhsT = lhs.transpose(); // (1x3)
      const rhsT = rhs.transpose(); // (1x3)
      return {
        value: lhs.transpose().mmul(rhs), // (1x1)
        diff: (mat?: Matrix) => {
          if (!mat) mat = Matrix.eye(1, 1);
          this.diff(mat.mmul(rhsT)); // (1x3)
          if (!isConstant(other)) other.diff(mat.mmul(lhsT)); // (1x3)
        }
      };
    }, this.rows);
  }

  cross(other: IVector3) {
    return new Vector3(() => {
      const lhs = this.value; // (3x1)
      const rhs = other.value; // (3x1)
      const lSkew = skew(lhs); // (3x3)
      const rSkew = skew(rhs); // (3x3)
      return {
        value: lSkew.mmul(rhs), // (1x1)
        diff: (mat?: Matrix) => {
          if (!mat) mat = Matrix.eye(3, 3);
          this.diff(mat.mmul(rSkew).mul(-1)); // (1x3)
          if (!isConstant(other)) other.diff(mat.mmul(lSkew)); // (1x3)
        }
      };
    }, this.rows);
  }
}
