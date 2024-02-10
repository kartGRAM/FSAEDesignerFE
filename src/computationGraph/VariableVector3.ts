/* eslint-disable camelcase */
import {Matrix} from 'ml-matrix';
import {IVector3} from './IVector3';
import {getVVector, Vector3Like} from './Functions';
import {IVariable} from './IVariable';
import {Vector3Base} from './Vector3Base';

export class VariableVector3
  extends Vector3Base
  implements IVector3, IVariable
{
  readonly isVector3 = true;

  _value: Matrix;

  _diff: Matrix | undefined;

  setValue(value: Vector3Like) {
    this.resetDiff();
    this._value = getVVector(value);
  }

  resetDiff() {
    this._diff = undefined;
  }

  constructor() {
    super();
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

  setJacobian(phi_q: Matrix, row: number, col: number) {
    if (!this._diff) throw new Error('diffが未計算');
    phi_q.subMatrixAdd(this._diff, row, col);
  }
}
