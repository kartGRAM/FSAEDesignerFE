/* eslint-disable max-classes-per-file */
import {Matrix} from 'ml-matrix';
import * as Three from 'three';
import {isNumber} from '@utils/helpers';
import {RetType} from './IComputationNode';
import {IVector3} from './IVector3';
import {IScalar} from './IScalar';
import {Scalar} from './Scalar';
import {isConstant, IConstant} from './IConstant';
import {ConstantScalar} from './ConstantScalar';
import {
  skew,
  Vector3Like,
  getVVector,
  normalizedVectorDiff,
  normVectorDiff
} from './Functions';

export abstract class Vector3Base {
  readonly isVector3 = true;

  abstract get value(): Matrix;

  abstract diff(fromLhs?: Matrix): void;

  abstract reset(): void;

  _reset: () => void;

  constructor(reset: () => void) {
    this._reset = reset;
  }

  get vector3Value() {
    const {value} = this;
    return new Three.Vector3(value.get(0, 0), value.get(1, 0), value.get(2, 0));
  }

  mul(other: IScalar | number) {
    if (isConstant(this) && (isNumber(other) || isConstant(other))) {
      const lhs = this.vector3Value; // (3x1)
      const rhs = isNumber(other) ? other : other.scalarValue; // (1x1)
      return new ConstantVector3(lhs.multiplyScalar(rhs));
    }

    return new Vector3(
      () => {
        const lhs = this.value; // (3x1)
        const rhs = isNumber(other) ? other : other.scalarValue; // (1x1)
        return {
          value: lhs.clone().mul(rhs), // (3x1)
          diff: (fromLhs: Matrix) => {
            if (!isConstant(this)) this.diff(fromLhs.clone().mul(rhs)); // (3x3)
            if (!isNumber(other) && !isConstant(other))
              other.diff(fromLhs.mmul(lhs)); // (3x1)
          }
        };
      },
      () => {
        this.reset();
        if (!isNumber(other) && isConstant(other)) other.reset();
      }
    );
  }

  dot(other: IVector3) {
    if (isConstant(this) && isConstant(other)) {
      const lhs = this.vector3Value; // (3x1)
      const rhs = other.vector3Value; // (3x1)
      return new ConstantScalar(lhs.dot(rhs));
    }

    return new Scalar(
      () => {
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
      },
      () => {
        this.reset();
        if (!isConstant(other)) other.reset();
      }
    );
  }

  cross(other: IVector3) {
    if (isConstant(this) && isConstant(other)) {
      const lhs = this.vector3Value; // (3x1)
      const rhs = other.vector3Value; // (3x1)
      return new ConstantVector3(lhs.cross(rhs));
    }
    return new Vector3(
      () => {
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
      },
      () => {
        this.reset();
        if (!isConstant(other)) other.reset();
      }
    );
  }

  add(other: IVector3): IVector3 {
    if (isConstant(this) && isConstant(other)) {
      const lhs = this.vector3Value; // (3x1)
      const rhs = other.vector3Value; // (3x1)
      return new ConstantVector3(lhs.add(rhs));
    }
    return new Vector3(
      () => {
        const lhs = this.value; // (3x1)
        const rhs = other.value; // (3x1)
        return {
          value: lhs.clone().add(rhs), // (1x1)
          diff: (mat: Matrix) => {
            if (!isConstant(this)) this.diff(mat); // (1x3)
            if (!isConstant(other)) other.diff(mat); // (1x3)
          }
        };
      },
      () => {
        this.reset();
        if (!isConstant(other)) other.reset();
      }
    );
  }

  sub(other: IVector3): IVector3 {
    if (isConstant(this) && isConstant(other)) {
      const lhs = this.vector3Value; // (3x1)
      const rhs = other.vector3Value; // (3x1)
      return new ConstantVector3(lhs.sub(rhs));
    }
    return new Vector3(
      () => {
        const lhs = this.value; // (3x1)
        const rhs = other.value; // (3x1)
        return {
          value: lhs.clone().sub(rhs), // (1x1)
          diff: (mat: Matrix) => {
            this.diff(mat); // (1x3)
            if (!isConstant(other)) other.diff(mat.clone().mul(-1)); // (1x3)
          }
        };
      },
      () => {
        this.reset();
        if (!isConstant(other)) other.reset();
      }
    );
  }

  length() {
    if (isConstant(this)) {
      const lhs = this.vector3Value; // (3x1)
      return new ConstantScalar(lhs.length());
    }
    return new Scalar(
      () => {
        const lhs = this.vector3Value; // (3x1)
        return {
          value: Matrix.eye(1, 1).mul(lhs.length()), // (1x1)
          diff: (mat: Matrix) => {
            this.diff(mat.mmul(normVectorDiff(lhs))); // (1x3)
          }
        };
      },
      () => {
        this.reset();
      }
    );
  }

  normalize() {
    if (isConstant(this)) {
      const lhs = this.vector3Value.clone().normalize(); // (3x1)
      return new ConstantVector3(lhs);
    }
    return new Vector3(
      () => {
        const lhs = this.vector3Value; // (3x1)
        return {
          value: getVVector(lhs.clone().normalize()), // (1x1)
          diff: (mat: Matrix) => {
            this.diff(mat.mmul(normalizedVectorDiff(lhs))); // (1x3)
          }
        };
      },
      () => {
        this.reset();
      }
    );
  }
}

export class Vector3 extends Vector3Base implements IVector3 {
  _value: () => RetType;

  _diff: (mat: Matrix) => void;

  storedValue: Matrix | undefined;

  constructor(value: () => RetType, reset: () => void) {
    super(reset);
    this._value = value;
    this._diff = () => {};
  }

  get value() {
    if (this.storedValue) return this.storedValue;
    const {value, diff} = this._value();
    this._diff = diff;
    this.storedValue = value;
    if (value.rows !== 3 && value.columns !== 1)
      throw new Error('3次元ベクトルじゃない');
    return value;
  }

  reset() {
    this.storedValue = undefined;
    this._reset();
  }

  diff(fromLhs: Matrix): void {
    this._diff(fromLhs);
  }
}

export class ConstantVector3
  extends Vector3Base
  implements IVector3, IConstant
{
  readonly isVector3 = true;

  readonly isConstant = true;

  value: Matrix;

  // eslint-disable-next-line class-methods-use-this
  diff(): void {}

  // eslint-disable-next-line class-methods-use-this
  reset() {}

  constructor(value: Matrix | Vector3Like) {
    super(() => {});
    if ('x' in value) {
      this.value = getVVector(value);
    } else {
      if (value.rows !== 3 || value.columns !== 3)
        throw new Error('Vector3じゃない');
      this.value = value;
    }
  }
}
