import {IComputationNode} from './IComputationNode';

export interface IConstant extends IComputationNode {
  readonly isConstant: true;
}

export function isConstant(node: IComputationNode): node is IConstant {
  return 'isConstant' in node;
}
