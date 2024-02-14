/* eslint-disable camelcase */
import {Matrix} from 'ml-matrix';
import {IScalar} from './IScalar';
import {IVariable} from './IVariable';
import {ScalarBase} from './Scalar';

export class VariableScalar extends ScalarBase implements IScalar, IVariable {
  readonly isScalar = true;

  readonly col;

  _value: Matrix;

  _diff: Matrix | undefined;

  setValue(value: number) {
    this.reset();
    this._value = Matrix.eye(1, 1).mul(value);
  }

  reset() {
    this._diff = undefined;
  }

  constructor(col: number) {
    super(() => this.reset());
    this.col = col;
    this._value = new Matrix(1, 1);
    this._diff = undefined;
  }

  get value() {
    return this._value;
  }

  diff(fromLhs: Matrix): void {
    if (!this._diff) this._diff = fromLhs.clone();
    else this._diff.add(fromLhs);
  }

  setJacobian(phi_q: Matrix, row: number) {
    if (this.col < 0) return;
    if (!this._diff) throw new Error('diffが未計算');
    phi_q.subMatrixAdd(this._diff, row, this.col);
  }
}
