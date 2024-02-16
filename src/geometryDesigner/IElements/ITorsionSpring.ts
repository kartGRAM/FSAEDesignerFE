import {
  IDataVector3,
  INamedVector3,
  INamedNumber,
  IDataNumber
} from '@gd/INamedValues';
import {Vector3} from 'three';
import {IElement, IDataElement, IMovingElement} from '../IElements';

export const className = 'TorsionSpring' as const;

export interface ITorsionSpring extends IElement, IMovingElement {
  // 固定点(フレーム側)
  readonly fixedPoints: [INamedVector3, INamedVector3];
  // 取付点
  readonly effortPoints: [INamedVector3, INamedVector3];
  // 取付点の現在の位置（表示用）
  readonly currentEffortPoints: Vector3[];

  // ばね定数
  readonly k: INamedNumber; // N・m/deg
}

export interface IDataTorsionSpring extends IDataElement {
  fixedPoints: IDataVector3[];
  effortPoints: IDataVector3[];
  dlCurrentNodeID: string;
  k: IDataNumber; // N・m/deg
}

export const isTorsionSpring = (element: IElement): element is ITorsionSpring =>
  element.className === className;

export const isDataTorsionSpring = (
  element: IDataElement
): element is IDataTorsionSpring => element.className === className;
