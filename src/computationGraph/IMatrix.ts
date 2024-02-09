import {IComputationNode} from './IComputationNode';
import {IScalar} from './IScalar';
import {IVector3} from './IVector3';

export interface IMatrix extends IComputationNode {
  readonly isMatrix: true;
  mul(other: IScalar | number): IMatrix;
  mmul(other: IMatrix): IMatrix;
  vmul(other: IVector3): IVector3;
}

export function isMatrix(node: IComputationNode): node is IMatrix {
  return 'isMatrix' in node;
}
