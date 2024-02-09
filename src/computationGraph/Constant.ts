import {Matrix} from 'ml-matrix';
import {IConstant} from './IConstant';

export class Constant implements IConstant {
  readonly isConstant = true;

  readonly value: Matrix;

  readonly rows;

  // eslint-disable-next-line class-methods-use-this
  diff(): void {}

  constructor(value: Matrix, rows: number) {
    this.rows = rows;
    this.value = value;
  }
}
