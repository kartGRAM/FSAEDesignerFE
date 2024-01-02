import {IDataVector3, INamedVector3} from '@gd/INamedValues';
import {IElement, IDataElement} from '../IElements';

export const className = 'Body' as const;

export interface IBody extends IElement {
  readonly fixedPoints: INamedVector3[];
  readonly points: INamedVector3[];
  readonly centerOfPoints: INamedVector3;
}

export interface IDataBody extends IDataElement {
  fixedPoints: IDataVector3[];
  points: IDataVector3[];
}

export const isBody = (element: IElement): element is IBody =>
  element.className === className;

export const isDataBody = (element: IDataElement): element is IDataBody =>
  element.className === className;
