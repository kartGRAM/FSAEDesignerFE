import {Matrix} from 'ml-matrix';
import {isNumber} from '@utils/helpers';
import {Constant, isConstant} from './Constant';
import {IVector3} from './IVector3';
import {Vector3} from './Vector3';
import {IScalar} from './IScalar';
import {skew, Vector3Like, getVVector} from './Functions';

export class ConstantVector3 extends Constant implements IVector3 {
  // eslint-disable-next-line class-methods-use-this
  diff(): void {}

  constructor(value: Matrix | Vector3Like) {
    if ('x' in value) {
      const mat = getVVector(value);
      super(mat);
    } else {
      super(value);
    }
  }

  mul(other: IScalar | number) {
    return new Vector3(() => {
      const lhs = this.value; // (3x1)
      const rhs = isNumber(other) ? Matrix.eye(1, 1).mul(other) : other.value; // (1x1)
      return () => {
        value: lhs.clone().mul(rhs), // (3x1)
        diff: (mat?: Matrix) => {
          if (!mat) mat = Matrix.eye(3, 3);
          if (!isNumber(other)) other.diff(mat.mmul(lhs)); // (3x1)
        }
      };
    });
  }

  dot(other: IVector3) {
    return new Vector3(() => {
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
    });
  }

  cross(other: IVector3) {
    return new Vector3(() => {
      const lhs = this.value; // (3x1)
      const rhs = other.value; // (3x1)
      const lSkew = skew(lhs); // (3x3)
      return {
        value: lSkew.mmul(rhs), // (1x1)
        diff: (mat?: Matrix) => {
          if (!mat) mat = Matrix.eye(3, 3);
          if (!isConstant(other)) other.diff(mat.mmul(lSkew)); // (1x3)
        }
      };
    });
  }
}
