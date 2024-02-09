import {Matrix} from 'ml-matrix';
import {isNumber} from '@utils/helpers';
import {IComputationNode, RetType} from './IComputationNode';
import {Scalar} from './Scalar';
import {isConstant} from './Constant';
import {ConstantVector3} from './ConstantVector3';
import {skew} from './Functions';

export class Vector3 implements IComputationNode {
  readonly isVector3 = true;

  _value: () => RetType;

  _diff: (mat?: Matrix) => void;

  constructor(value: () => RetType) {
    this._value = value;
    this._diff = () => {};
  }

  get value() {
    const {value, diff} = this._value();
    this._diff = diff;
    if (value.rows !== 3 && value.columns !== 1)
      throw new Error('3次元ベクトルじゃない');
    return value;
  }

  diff(mat?: Matrix): void {
    this._diff(mat);
  }

  mul(other: Scalar | number) {
    return new Vector3(() => {
      const lhs = this.value; // (3x1)
      const rhs = isNumber(other) ? Matrix.eye(1, 1).mul(other) : other.value; // (1x1)
      return {
        value: lhs.clone().mul(rhs), // (3x1)
        diff: (mat?: Matrix) => {
          if (!mat) mat = Matrix.eye(3, 3);
          this.diff(mat.clone().mul(rhs)); // (3x3)
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
      const rhsT = rhs.transpose(); // (1x3)
      return {
        value: lhs.transpose().mmul(rhs), // (1x1)
        diff: (mat?: Matrix) => {
          if (!mat) mat = Matrix.eye(1, 1);
          this.diff(mat.mmul(rhsT)); // (1x3)
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
      const rSkew = skew(rhs); // (3x3)
      return {
        value: lSkew.mmul(rhs), // (1x1)
        diff: (mat?: Matrix) => {
          if (!mat) mat = Matrix.eye(3, 3);
          this.diff(mat.mmul(rSkew).mul(-1)); // (1x3)
          if (!isConstant(other)) other.diff(mat.mmul(lSkew)); // (1x3)
        }
      };
    });
  }
}

export function isVector3(node: IComputationNode): node is Vector3 {
  return 'isVector3' in node;
}
