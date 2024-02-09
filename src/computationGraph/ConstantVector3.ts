import {Matrix} from 'ml-matrix';
import {isNumber} from '@utils/helpers';
import {Constant} from './Constant';
import {isConstant} from './IConstant';
import {IVector3} from './IVector3';
import {Vector3} from './Vector3';
import {IScalar} from './IScalar';
import {Scalar} from './Scalar';
import {skew, Vector3Like, getVVector} from './Functions';

export class ConstantVector3 extends Constant implements IVector3 {
  readonly isVector3 = true;

  // eslint-disable-next-line class-methods-use-this
  diff(): void {}

  constructor(value: Matrix | Vector3Like, rows: number) {
    let mat: Matrix;
    if ('x' in value) {
      mat = getVVector(value);
    } else {
      mat = value;
    }
    super(mat, rows);
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
      return {
        value: lhs.transpose().mmul(rhs), // (1x1)
        diff: (mat?: Matrix) => {
          if (!mat) mat = Matrix.eye(1, 1);
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
      return {
        value: lSkew.mmul(rhs), // (1x1)
        diff: (mat?: Matrix) => {
          if (this.rows === 3 && !mat) mat = Matrix.eye(3, 3);
          else if (!mat) throw new Error('rowsが3以外では、matが必要');
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
          if (!isConstant(other)) other.diff(mat.clone().mul(-1)); // (1x3)
        }
      };
    }, this.rows);
  }
}
