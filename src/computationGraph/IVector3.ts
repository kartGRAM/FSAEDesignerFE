import {IComputationNode} from './IComputationNode';
import {IScalar} from './IScalar';

export interface IVector3 extends IComputationNode {
  mul(other: IScalar | number): IVector3;
  dot(other: IVector3): IScalar;
  cross(other: IVector3): IVector3;
}
