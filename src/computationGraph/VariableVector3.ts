/* eslint-disable camelcase */
import {Matrix} from 'ml-matrix';
import {isNumber} from '@utils/helpers';
import {IVector3} from './IVector3';
import {Scalar} from './Scalar';
import {IScalar} from './IScalar';
import {isConstant} from './IConstant';
import {Vector3} from './Vector3';
import {skew, getVVector, Vector3Like} from './Functions';
import {IVariable} from './IVariable';

export class VariableVector3 implements IVector3, IVariable {
  readonly isVector3 = true;

  _value: Matrix;

  _diff: Matrix;

  rows: number;

  setValue(value: Vector3Like) {
    this.resetDiff();
    this._value = getVVector(value);
  }

  resetDiff() {
    this._diff = new Matrix(this.rows, 3);
  }

  constructor(rows: number) {
    this._value = new Matrix(3, 1);
    this.rows = rows;
    this._diff = new Matrix(rows, 3);
  }

  get value() {
    return this._value;
  }

  diff(fromLhs: Matrix): void {
    this._diff.add(fromLhs);
  }

  setJacobian(phi_q: Matrix, row: number, col: number) {
    phi_q.subMatrixAdd(this._diff, row, col);
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
          if (this.rows === 3 && !mat) mat = Matrix.eye(3, 3);
          else if (!mat) throw new Error('rowsが3以外では、matが必要');
          this.diff(mat.mmul(rSkew).mul(-1)); // (1x3)
          if (!isConstant(other)) other.diff(mat.mmul(lSkew)); // (1x3)
        }
      };
    }, this.rows);
  }

  add(other: IVector3): IVector3 {
    return new Vector3(() => {
      const lhs = this.value; // (3x1)
      const rhs = other.value; // (3x1)
      return {
        value: lhs.clone().add(rhs), // (1x1)
        diff: (mat?: Matrix) => {
          if (this.rows === 3 && !mat) mat = Matrix.eye(3, 3);
          else if (!mat) throw new Error('rowsが3以外では、matが必要');
          this.diff(mat); // (1x3)
          if (!isConstant(other)) other.diff(mat); // (1x3)
        }
      };
    }, this.rows);
  }

  sub(other: IVector3): IVector3 {
    return new Vector3(() => {
      const lhs = this.value; // (3x1)
      const rhs = other.value; // (3x1)
      return {
        value: lhs.clone().sub(rhs), // (1x1)
        diff: (mat?: Matrix) => {
          if (this.rows === 3 && !mat) mat = Matrix.eye(3, 3);
          else if (!mat) throw new Error('rowsが3以外では、matが必要');
          this.diff(mat); // (1x3)
          if (!isConstant(other)) other.diff(mat.clone().mul(-1)); // (1x3)
        }
      };
    }, this.rows);
  }
}
