import {AtLeast1} from '@app/utils/atLeast';
import {IDataVector3, INamedVector3} from '@gd/INamedValues';
import {IElement, IDataElement} from '../IElements';
import {IBody} from './IBody';

export const className = 'AArm' as const;

export interface IAArm extends IBody {
  readonly fixedPoints: [INamedVector3, INamedVector3];
  readonly points: AtLeast1<INamedVector3>;
}

export interface IDataAArm extends IDataElement {
  fixedPoints: IDataVector3[];
  points: IDataVector3[];
}

export const isDataAArm = (element: IDataElement): element is IDataAArm =>
  element.className === className;

export const isAArm = (element: IElement): element is IAArm =>
  element.className === className;
