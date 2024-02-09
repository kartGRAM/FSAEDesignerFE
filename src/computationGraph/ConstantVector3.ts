import {Matrix} from 'ml-matrix';
import {isNumber} from '@utils/helpers';
import {Constant, isConstant} from './Constant';
import {Vector3} from './Vector3';
import {Scalar} from './Scalar';
import {skew} from './Functions';

export class ConstantVector3 extends Constant {
  // eslint-disable-next-line class-methods-use-this
  diff(): void {}

  constructor(value: Matrix | {x: number; y: number; z: number}) {
    if ('x' in value) {
      const {x, y, z} = value;
      const mat = new Matrix([[x], [y], [z]]);
      super(mat);
    } else {
      super(value);
    }
  }

  mul(other: Scalar | number) {
    return new Vector3(() => {
      const lhs = this.value; // (3x1)
      const rhs = isNumber(other) ? Matrix.eye(1, 1).mul(other) : other.value; // (1x1)
      return {
        value: lhs.clone().mul(rhs), // (3x1)
        diff: (mat?: Matrix) => {
          if (!mat) mat = Matrix.eye(3, 3);
          if (!isNumber(other)) other.diff(mat.mmul(lhs)); // (3x1)
        }
      };
    });
  }

  dot(other: Vector3 | ConstantVector3) {
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

  cross(other: Vector3 | ConstantVector3) {
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
