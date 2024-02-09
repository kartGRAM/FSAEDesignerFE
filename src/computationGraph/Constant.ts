import {Matrix} from 'ml-matrix';
import {IComputationNode} from './IComputationNode';

export class Constant implements IComputationNode {
  readonly isConstant = true;

  readonly value: Matrix;

  // eslint-disable-next-line class-methods-use-this
  diff(): void {}

  constructor(value: Matrix) {
    this.value = value;
  }
}

export function isConstant(node: IComputationNode): node is Constant {
  return 'isConstant' in node;
}
