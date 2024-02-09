import {Matrix} from 'ml-matrix';
import {IComputationNode} from './IComputationNode';

export class Variable implements IComputationNode {
  readonly value: Matrix;

  constructor(rows: number, columns: number) {
    this.value = new Matrix(rows, columns);
  }

  setValue(value: Matrix) {
    this.value.mul(0);
    this.value.add(value);
  }
}
