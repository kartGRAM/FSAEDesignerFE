import {IComputationNode} from './IComputationNode';

export interface IScalar extends IComputationNode {
  readonly isScalar: true;
  readonly scalarValue: number;

  mul(other: IScalar | number): IScalar;
  add(other: IScalar | number): IScalar;
  sub(other: IScalar | number): IScalar;
}

export function isScalar(node: IComputationNode): node is IScalar {
  return 'isScalar' in node;
}
