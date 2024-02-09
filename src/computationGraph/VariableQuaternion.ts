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

  _diff: Matrix;

  rows: number;

  setValue(value: QuaternionLike) {
    this._value = value;
  }

  constructor(rows: number) {
    this._value = new Quaternion();
    this.rows = rows;
    this._diff = new Matrix(rows, 4);
  }

  get value() {
    this._diff = new Matrix(this.rows, 4);
    return getVQuaternion(this._value);
  }

  diff(fromLhs: Matrix): void {
    this._diff.add(fromLhs);
  }

  setJacobian(phi_q: Matrix, row: number, col: number) {
    phi_q.subMatrixAdd(this._diff, row, col);
  }

  getRotationMatrix(): IMatrix {
    return new CMatrix(() => {
      const G = decompositionMatrixG(this._value);
      const A = rotationMatrix(this._value);
      return {
        value: A,
        diff: (fromLhs?: Matrix, fromRhs?: Matrix) => {
          if (!fromRhs) throw new Error('ベクトルが必要');
          if (fromRhs.rows !== 3 || fromRhs.columns !== 1)
            throw new Error('Vector3じゃない');
          const rSkew = skew(fromRhs);
          const AsG = A.mmul(rSkew).mmul(G).mul(-2);
          this.diff(fromLhs ? fromLhs.mmul(AsG) : AsG);
        }
      };
    }, this.rows);
  }
}
