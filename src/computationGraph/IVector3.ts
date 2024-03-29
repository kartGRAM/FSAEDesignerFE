import {Vector3} from 'three';
import {IComputationNode} from './IComputationNode';
import {IScalar} from './IScalar';

export interface IVector3 extends IComputationNode {
  readonly isCVector3: true;
  readonly vector3Value: Vector3;
  mul(other: IScalar | number): IVector3;
  dot(other: IVector3 | Vector3): IScalar;
  cross(other: IVector3): IVector3;

  add(other: IVector3): IVector3;
  sub(other: IVector3): IVector3;

  length(): IScalar;
  normalize(): IVector3;
}

export function isVector3(node: IComputationNode): node is IVector3 {
  return 'isCVector3' in node;
}
