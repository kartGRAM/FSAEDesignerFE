import {IComputationNode} from './IComputationNode';
import {IMatrix} from './IMatrix';

export interface IQuaternion extends IComputationNode {
  readonly isQuaternion: true;
  getRotationMatrix(): IMatrix;
}

export function isQuaternion(node: IComputationNode): node is IQuaternion {
  return 'isQuaternion' in node;
}
