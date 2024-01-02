import {IDataVector3, IDataNumber, INamedVector3} from '@gd/INamedValues';
import {IElement, IDataElement, IMovingElement} from '../IElements';

export const className = 'TorsionSpring' as const;

export interface ITorsionSpring extends IElement, IMovingElement {
  // 固定点(フレーム側)
  readonly fixedPoints: [INamedVector3, INamedVector3];
  // 取付点
  readonly effortPoints: [INamedVector3, INamedVector3];
}

export interface IDataTorsionSpring extends IDataElement {
  fixedPoints: IDataVector3[];
  effortPoints: IDataNumber[];
  dlCurrentNodeID: string;
}

export const isTorsionSpring = (element: IElement): element is ITorsionSpring =>
  element.className === className;

export const isDataLinearBushing = (
  element: IDataElement
): element is IDataTorsionSpring => element.className === className;
