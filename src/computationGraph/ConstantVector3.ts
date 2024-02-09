import {Matrix} from 'ml-matrix';
import {Constant, isConstant} from './Constant';
import {Vector3} from './Vector3';

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
}
