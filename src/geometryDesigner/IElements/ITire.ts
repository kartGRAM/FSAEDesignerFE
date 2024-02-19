import {
  IDataVector3,
  IDataNumber,
  INamedVector3,
  INamedNumber,
  INamedVector3LW
} from '@gd/INamedValues';
import {Vector3} from 'three';
import {INearestNeighborToPlane} from '@gd/SpecialPoints';
import {IElement, IDataElement} from '../IElements';

export const className = 'Tire' as const;

export interface ITire extends IElement, INearestNeighborToPlane {
  readonly tireCenter: INamedVector3;
  readonly tireAxis: INamedVector3;
  readonly toInnerBearing: INamedNumber;
  readonly toOuterBearing: INamedNumber;
  readonly tread: INamedNumber;
  readonly innerBearing: INamedVector3LW;
  readonly outerBearing: INamedVector3LW;
  readonly diameter: number;
  readonly radius: number;
  readonly bearingDistance: number;

  angularVelocity: number;
  centrifugalForce: Vector3;
  gravity: Vector3;
  fy: Vector3;
  fx: Vector3;
  fz: Vector3;
  innerBearingForce: Vector3;
  outerBearingForce: Vector3;
}

export interface IDataTire extends IDataElement {
  tireCenter: IDataVector3;
  tireAxis?: IDataVector3;
  toLeftBearing: IDataNumber;
  toRightBearing: IDataNumber;
  tread?: IDataNumber;
}

export const isTire = (element: IElement): element is ITire =>
  element.className === className;

export const isDataTire = (element: IDataElement): element is IDataTire =>
  element.className === className;
