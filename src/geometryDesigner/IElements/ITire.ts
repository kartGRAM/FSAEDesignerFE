import {
  IDataVector3,
  IDataNumber,
  INamedVector3,
  INamedNumber,
  INamedVector3LW
} from '@gd/INamedValues';
import {INearestNeighborToPlane} from '@gd/SpecialPoints';
import {IElement, IDataElement} from '../IElements';

export interface ITire extends IElement, INearestNeighborToPlane {
  readonly tireCenter: INamedVector3;
  readonly toLeftBearing: INamedNumber;
  readonly toRightBearing: INamedNumber;
  readonly rightBearing: INamedVector3LW;
  readonly leftBearing: INamedVector3LW;
  readonly diameter: number;
  readonly bearingDistance: number;
}

export interface IDataTire extends IDataElement {
  tireCenter: IDataVector3;
  toLeftBearing: IDataNumber;
  toRightBearing: IDataNumber;
}

export const isTire = (element: IElement): element is ITire =>
  element.className === 'Tire';

export const isDataTire = (element: IDataElement): element is IDataTire =>
  element.className === 'Tire';
