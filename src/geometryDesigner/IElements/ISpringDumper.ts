import {Vector3} from 'three';
import {
  IDataVector3,
  IDataNumber,
  INamedVector3,
  INamedNumber
} from '@gd/INamedValues';
import {IElement, IDataElement, IMovingElement} from '../IElements';

export const className = 'SpringDumper' as const;

export interface ISpringDumper extends IElement, IMovingElement {
  readonly controllable: true;
  readonly fixedPoint: INamedVector3;
  readonly point: INamedVector3;
  readonly dlMin: INamedNumber;
  readonly dlMax: INamedNumber;
  readonly k: INamedNumber; // N/mm
  readonly length: number;
  readonly currentPoint: Vector3;
  readonly isLimited: boolean;

  centrifugalForce: Vector3;
  gravity: Vector3;
  fixedPointForce: Vector3;
  pointForce: Vector3;
}

export interface IDataSpringDumper extends IDataElement {
  fixedPoint: IDataVector3;
  dlCurrentNodeID: string;
  point: IDataVector3;
  dlMin: IDataNumber;
  dlMax: IDataNumber;
  k: IDataNumber;
}

export const isSpringDumper = (element: IElement): element is ISpringDumper =>
  element.className === className;

export const isDataSpringDumper = (
  element: IDataElement
): element is IDataSpringDumper => element.className === className;
