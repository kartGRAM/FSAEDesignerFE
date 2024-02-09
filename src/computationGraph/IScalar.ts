import {IComputationNode} from './IComputationNode';

export interface IScalar extends IComputationNode {
  readonly isScalar: true;
}

export function isScalar(node: IComputationNode): node is IScalar {
  return 'isScalar' in node;
}
