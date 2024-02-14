import {AtLeast1} from '@app/utils/atLeast';
import {Vector3} from 'three';
import {
  IDataVector3,
  IDataNumber,
  INamedVector3,
  INamedNumber
} from '@gd/INamedValues';
import {IElement, IDataElement, IMovingElement} from '../IElements';

export const className = 'LinearBushing' as const;

export interface ILinearBushing extends IElement, IMovingElement {
  readonly controllable: true;
  // 固定点(フレーム側)
  readonly fixedPoints: [INamedVector3, INamedVector3];
  // 移動点(タイロッド側)
  // fixedPointsの中点を基準とし、idx=0⇒idx=1方向を正とした位置
  readonly toPoints: AtLeast1<INamedNumber>;
  readonly dlMin: INamedNumber;
  readonly dlMax: INamedNumber;

  readonly points: INamedVector3[];
  readonly supportDistance: number;
  readonly currentPoints: Vector3[];
  readonly isLimited: boolean;

  centrifugalForce: Vector3;
  gravity: Vector3;
  fixedPointForce: Vector3[];
  pointForce: Vector3[];
}

export interface IDataLinearBushing extends IDataElement {
  fixedPoints: IDataVector3[];
  toPoints: IDataNumber[];
  dlCurrentNodeID: string;
  dlMin: IDataNumber;
  dlMax: IDataNumber;
}

export const isLinearBushing = (element: IElement): element is ILinearBushing =>
  element.className === className;

export const isDataLinearBushing = (
  element: IDataElement
): element is IDataLinearBushing => element.className === className;
