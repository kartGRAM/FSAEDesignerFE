import {AtLeast2} from '@app/utils/atLeast';
import {IDataVector3, INamedVector3} from '@gd/INamedValues';
import {IElement, IDataElement} from '../IElements';
import {IBody} from './IBody';

export const className = 'BellCrank' as const;

export interface IBellCrank extends IBody {
  // Axis
  readonly fixedPoints: [INamedVector3, INamedVector3];
  // Points
  readonly points: AtLeast2<INamedVector3>;
}

export interface IDataBellCrank extends IDataElement {
  fixedPoints: IDataVector3[];
  points: IDataVector3[];
}

export const isBellCrank = (element: IElement): element is IBellCrank =>
  element.className === className;

export const isDataBellCrank = (
  element: IDataElement
): element is IDataBellCrank => element.className === className;
