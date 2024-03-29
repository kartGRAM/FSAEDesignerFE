import {IDataVector3, INamedVector3} from '@gd/INamedValues';
import {Vector3} from 'three';
import {IElement, IDataElement} from '../IElements';

export const className = 'Bar' as const;

export interface IBar extends IElement {
  readonly fixedPoint: INamedVector3;
  readonly point: INamedVector3;
  readonly length: number;

  centrifugalForce: Vector3;
  gravity: Vector3;
  fixedPointForce: Vector3;
  pointForce: Vector3;
}

export interface IDataBar extends IDataElement {
  fixedPoint: IDataVector3;
  point: IDataVector3;
}

export const isBar = (element: IElement): element is IBar =>
  element.className === className || element.className === 'SpringDumper';

export const isDataBar = (element: IDataElement): element is IDataBar =>
  element.className === className;
