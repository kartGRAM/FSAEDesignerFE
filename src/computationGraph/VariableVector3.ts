/* eslint-disable camelcase */
import {Matrix} from 'ml-matrix';
import {IVector3} from './IVector3';
import {getVVector, Vector3Like} from './Functions';
import {IVariable} from './IVariable';
import {Vector3Base} from './Vector3';

export class VariableVector3
  extends Vector3Base
  implements IVector3, IVariable
{
  readonly isCVector3 = true;

  readonly col;

  _value: Matrix;

  _diff: Matrix | undefined;

  setValue(value: Vector3Like) {
    this.reset();
    this._value = getVVector(value);
  }

  reset() {
    this._diff = undefined;
  }

  constructor(col: () => number) {
    super(() => this.reset());
    this.col = col;
    this._value = new Matrix(3, 1);
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
    if (this.col() < 0) return;
    if (!this._diff) throw new Error('diffが未計算');
    phi_q.setSubMatrix(this._diff, row, this.col());
  }
}
