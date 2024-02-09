import {IComputationNode} from './IComputationNode';

export interface IScalar extends IComputationNode {
  readonly isScalar: true;
  readonly scalarValue: number;
}

export function isScalar(node: IComputationNode): node is IScalar {
  return 'isScalar' in node;
}
