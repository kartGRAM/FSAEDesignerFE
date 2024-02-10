import {Matrix} from 'ml-matrix';
import {isNumber} from '@utils/helpers';
import {IScalar} from './IScalar';
import {Scalar} from './Scalar';
import {IVector3} from './IVector3';
import {Vector3} from './Vector3';
import {isConstant} from './IConstant';
import {skew} from './Functions';

export abstract class Vector3Base {
  readonly isVector3 = true;

  abstract readonly rows: number;

  abstract get value(): Matrix;

  abstract diff(fromLhs?: Matrix): void;

  mul(other: IScalar | number) {
    return new Vector3(() => {
      const lhs = this.value; // (3x1)
      const rhs = isNumber(other) ? Matrix.eye(1, 1).mul(other) : other.value; // (1x1)
      return {
        value: lhs.clone().mul(rhs), // (3x1)
        diff: (fromLhs: Matrix) => {
          if (!isConstant(this)) this.diff(fromLhs.clone().mul(rhs)); // (3x3)
          if (!isNumber(other) && !isConstant(other))
            other.diff(fromLhs.mmul(lhs)); // (3x1)
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
        diff: (mat: Matrix) => {
          if (!isConstant(this)) this.diff(mat.mmul(rhsT)); // (1x3)
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
        diff: (mat: Matrix) => {
          if (!isConstant(this)) this.diff(mat.mmul(rSkew).mul(-1)); // (1x3)
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
        diff: (mat: Matrix) => {
          if (!isConstant(this)) this.diff(mat); // (1x3)
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
        diff: (mat: Matrix) => {
          this.diff(mat); // (1x3)
          if (!isConstant(other)) other.diff(mat.clone().mul(-1)); // (1x3)
        }
      };
    }, this.rows);
  }
}
