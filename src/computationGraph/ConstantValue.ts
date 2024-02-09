import {Matrix} from 'ml-matrix';
import {IComputationNode} from './IComputationNode';

export class Conatant implements IComputationNode {
  readonly value: Matrix;

  constructor(value: Matrix) {
    this.value = value;
  }
}
