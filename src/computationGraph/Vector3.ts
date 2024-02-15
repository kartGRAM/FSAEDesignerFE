/* eslint-disable camelcase */
/* eslint-disable max-classes-per-file */
import {Matrix} from 'ml-matrix';
import * as Three from 'three';
import {isNumber} from '@utils/helpers';
import {isVector3 as isThreeVector3} from '@utils/three';
import {RetType, ResetOptions} from './IComputationNode';
import {IVector3} from './IVector3';
import {IScalar} from './IScalar';
import {Scalar} from './Scalar';
import {isConstant} from './IConstant';
import {
  skew,
  getVVector,
  normalizedVectorDiff,
  normVectorDiff
} from './Functions';
import {ComputationNodeBase} from './ComputationNodeBase';

export abstract class Vector3Base extends ComputationNodeBase {
  readonly isCVector3 = true;

  abstract get value(): Matrix;

  abstract diff(fromLhs?: Matrix): void;

  abstract setJacobian(phi_q: Matrix, row: number): void;

  constructor(reset: (options: ResetOptions) => void) {
    super();
    this._reset = reset;
  }

  get vector3Value() {
    const {value} = this;
    return new Three.Vector3(value.get(0, 0), value.get(1, 0), value.get(2, 0));
  }

  mul(other: IScalar | number) {
    return new Vector3(
      () => {
        const lhs = this.value; // (3x1)
        const rhs = isNumber(other) ? other : other.scalarValue; // (1x1)
        return {
          value: () => lhs.clone().mul(rhs), // (3x1)
          diff: (fromLhs: Matrix) => {
            if (!isConstant(this)) this.diff(fromLhs.clone().mul(rhs)); // (3x3)
            if (!isNumber(other) && !isConstant(other))
              other.diff(fromLhs.mmul(lhs)); // (3x1)
          }
        };
      },
      (options) => {
        this.reset(options);
        if (!isNumber(other) && !isConstant(other)) other.reset(options);
      },
      (phi_q, row) => {
        this.setJacobian(phi_q, row);
        if (!isNumber(other) && !isConstant(other))
          other.setJacobian(phi_q, row);
      }
    );
  }

  dot(other: IVector3 | Three.Vector3) {
    return new Scalar(
      () => {
        const lhs = this.value; // (3x1)
        const rhs = isThreeVector3(other) ? getVVector(other) : other.value; // (3x1)
        const lhsT = lhs.transpose(); // (1x3)
        const rhsT = rhs.transpose(); // (1x3)
        return {
          value: () => lhs.transpose().mmul(rhs), // (1x1)
          diff: (mat: Matrix) => {
            if (!isConstant(this)) this.diff(mat.mmul(rhsT)); // (1x3)
            if (!isThreeVector3(other) && !isConstant(other))
              other.diff(mat.mmul(lhsT)); // (1x3)
          }
        };
      },
      (options) => {
        this.reset(options);
        if (!isThreeVector3(other) && !isConstant(other)) other.reset(options);
      },
      (phi_q, row) => {
        this.setJacobian(phi_q, row);
        if (!isThreeVector3(other) && !isConstant(other))
          other.setJacobian(phi_q, row);
      }
    );
  }

  cross(other: IVector3) {
    return new Vector3(
      () => {
        const lhs = this.value; // (3x1)
        const rhs = other.value; // (3x1)
        const lSkew = skew(lhs); // (3x3)
        const rSkew = skew(rhs); // (3x3)
        return {
          value: () => lSkew.mmul(rhs), // (1x1)
          diff: (mat: Matrix) => {
            if (!isConstant(this)) this.diff(mat.mmul(rSkew).mul(-1)); // (1x3)
            if (!isConstant(other)) other.diff(mat.mmul(lSkew)); // (1x3)
          }
        };
      },
      (options) => {
        this.reset(options);
        if (!isConstant(other)) other.reset(options);
      },
      (phi_q, row) => {
        this.setJacobian(phi_q, row);
        if (!isConstant(other)) other.setJacobian(phi_q, row);
      }
    );
  }

  add(other: IVector3): IVector3 {
    return new Vector3(
      () => {
        const lhs = this.value; // (3x1)
        const rhs = other.value; // (3x1)
        return {
          value: () => lhs.clone().add(rhs), // (1x1)
          diff: (mat: Matrix) => {
            if (!isConstant(this)) this.diff(mat); // (1x3)
            if (!isConstant(other)) other.diff(mat); // (1x3)
          }
        };
      },
      (options) => {
        this.reset(options);
        if (!isConstant(other)) other.reset(options);
      },
      (phi_q, row) => {
        this.setJacobian(phi_q, row);
        if (!isConstant(other)) other.setJacobian(phi_q, row);
      }
    );
  }

  sub(other: IVector3): IVector3 {
    return new Vector3(
      () => {
        const lhs = this.value; // (3x1)
        const rhs = other.value; // (3x1)
        return {
          value: () => lhs.clone().sub(rhs), // (1x1)
          diff: (mat: Matrix) => {
            this.diff(mat); // (1x3)
            if (!isConstant(other)) other.diff(mat.clone().mul(-1)); // (1x3)
          }
        };
      },
      (options) => {
        this.reset(options);
        if (!isConstant(other)) other.reset(options);
      },
      (phi_q, row) => {
        this.setJacobian(phi_q, row);
        if (!isConstant(other)) other.setJacobian(phi_q, row);
      }
    );
  }

  length() {
    return new Scalar(
      () => {
        const lhs = this.vector3Value; // (3x1)
        return {
          value: () => Matrix.eye(1, 1).mul(lhs.length()), // (1x1)
          diff: (mat: Matrix) => {
            this.diff(mat.mmul(normVectorDiff(lhs))); // (1x3)
          }
        };
      },
      (options) => {
        this.reset(options);
      },
      (phi_q, row) => {
        this.setJacobian(phi_q, row);
      }
    );
  }

  normalize() {
    return new Vector3(
      () => {
        const lhs = this.vector3Value; // (3x1)
        return {
          value: () => getVVector(lhs.clone().normalize()), // (1x1)
          diff: (mat: Matrix) => {
            this.diff(mat.mmul(normalizedVectorDiff(lhs))); // (1x3)
          }
        };
      },
      (options) => {
        this.reset(options);
      },
      (phi_q, row) => {
        this.setJacobian(phi_q, row);
      }
    );
  }
}

export class Vector3 extends Vector3Base implements IVector3 {
  _value: () => RetType;

  _diff: (mat: Matrix) => void;

  _setJacobian: (phi_q: Matrix, row: number) => void;

  constructor(
    value: () => RetType,
    reset: (options: ResetOptions) => void,
    setJacobian: (phi_q: Matrix, row: number) => void
  ) {
    super(reset);
    this._setJacobian = setJacobian;
    this._value = value;
    this._diff = () => {};
  }

  get value() {
    if (this.storedValue) return this.storedValue;
    const {value, diff} = this._value();
    this._diff = diff;
    this.storedValue = value();
    if (this.storedValue.rows !== 3 && this.storedValue.columns !== 1)
      throw new Error('3次元ベクトルじゃない');
    return this.storedValue;
  }

  diff(fromLhs: Matrix): void {
    this._diff(fromLhs);
  }

  setJacobian(phi_q: Matrix, row: number): void {
    this._setJacobian(phi_q, row);
  }
}
