/* eslint-disable camelcase */
import {Matrix} from 'ml-matrix';
import {Quaternion} from 'three';
import {IQuaternion} from './IQuaternion';
import {IMatrix} from './IMatrix';
import {Matrix as CMatrix} from './Matrix';
import {
  skew,
  getVQuaternion,
  QuaternionLike,
  rotationMatrix,
  decompositionMatrixG
} from './Functions';
import {IVariable} from './IVariable';

export class VariableQuaternion implements IQuaternion, IVariable {
  readonly isQuaternion = true;

  _value: QuaternionLike;

  _diff: Matrix | undefined;

  setValue(value: QuaternionLike) {
    this.resetDiff();
    this._value = value;
  }

  resetDiff() {
    this._diff = undefined;
  }

  constructor() {
    this._value = new Quaternion();
    this._diff = undefined;
  }

  get value() {
    return getVQuaternion(this._value);
  }

  diff(fromLhs: Matrix): void {
    if (!this._diff) this._diff = fromLhs.clone();
    else this._diff.add(fromLhs);
  }

  setJacobian(phi_q: Matrix, row: number, col: number) {
    if (!this._diff) throw new Error('diffが未計算');
    phi_q.subMatrixAdd(this._diff, row, col);
  }

  getRotationMatrix(): IMatrix {
    return new CMatrix(() => {
      const G = decompositionMatrixG(this._value);
      const A = rotationMatrix(this._value);
      return {
        value: A,
        diff: (fromLhs: Matrix, fromRhs?: Matrix) => {
          if (!fromRhs) throw new Error('ベクトルが必要');
          if (fromRhs.rows !== 3 || fromRhs.columns !== 1)
            throw new Error('Vector3じゃない');
          const rSkew = skew(fromRhs);
          const AsG = A.mmul(rSkew).mmul(G).mul(-2);
          this.diff(fromLhs.mmul(AsG));
        }
      };
    });
  }
}
