import {IComputationNode} from './IComputationNode';
import {IScalar} from './IScalar';
import {Vector3Like} from './Functions';

export interface IVector3 extends IComputationNode {
  readonly isVector3: true;
  readonly vector3Value: Vector3Like;
  mul(other: IScalar | number): IVector3;
  dot(other: IVector3): IScalar;
  cross(other: IVector3): IVector3;

  add(other: IVector3): IVector3;
  sub(other: IVector3): IVector3;
}

export function isVector3(node: IComputationNode): node is IVector3 {
  return 'isVector3' in node;
}
