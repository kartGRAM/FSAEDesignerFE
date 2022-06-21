import {AtLeast1, AtLeast2} from '@app/utils/atLeast';
import {zip2} from '@app/utils/zip';
import {Vector3, Matrix3} from 'three';
import {
  IDataVector3,
  IDataMatrix3,
  NamedVector3,
  NamedMatrix3,
  NamedPrimitive
} from './NamedValues';

export type Radian = number;
export type ElementID = number;
export type NodeID = number;
export type Millimeter = number;
export interface Joint {
  lhs: [ElementID, NodeID];
  rhs: [ElementID, NodeID];
}

export interface NodeWithPath {
  p: Vector3;
  path: string;
}

export interface INodeWithPath {
  p: IDataVector3;
  path: string;
}

export function getElementByPath(
  root: IAssembly | undefined | null,
  path: string
): IElement | null {
  return getElementByPathCore(root, path) as IElement | null;
}

export function getDataElementByPath(
  root: IDataAssembly | undefined | null,
  path: string
): IDataElement | null {
  return getElementByPathCore(root, path) as IDataElement | null;
}

function getElementByPathCore(
  root: IAssembly | IDataAssembly | undefined | null,
  path: string
): IElement | IDataElement | null {
  if (!root) return null;
  const idx = path.indexOf(root.nodeID);
  if (idx === -1) return null;
  if (idx === 0) return root;
  const fromThis = path.slice(0, idx - 1);
  let element: IElement | IDataElement | null = null;
  // eslint-disable-next-line no-restricted-syntax
  for (const child of root.children) {
    if (isElement(child) && isAssembly(child)) {
      element = getElementByPathCore(child, fromThis);
      if (element != null) return element;
    } else if (isDataElement(child) && isDataAssembly(child)) {
      element = getElementByPathCore(child, fromThis);
      if (element != null) return element;
    } else if (child.nodeID === fromThis) {
      return child;
    }
  }
  return element;
}

export interface IElement {
  readonly className: string;
  name: NamedPrimitive<string>;
  inertialTensor: NamedMatrix3;
  mass: NamedPrimitive<number>;
  centerOfGravity: NamedVector3;
  visible: boolean | undefined;
  parent: IAssembly | null;
  readonly nodeID: string;
  readonly absPath: string;
  getNodes(): NodeWithPath[];
  getMirror(): IElement;
  getDataElement(): IDataElement;
  // eslint-disable-next-line no-unused-vars
  arrange(parentPosition?: Vector3): void;
  position: Vector3;
  rotation?: Matrix3;
  initialPosition: Vector3;
}

export interface IDataElement {
  className: string;
  name: string;
  inertialTensor: IDataMatrix3;
  mass: number;
  centerOfGravity: IDataVector3;
  nodeID: string;
  absPath: string;
  visible: boolean | undefined;
  position: IDataVector3;
  rotation?: IDataMatrix3;
  initialPosition: IDataVector3;
}

export interface IAssembly extends IElement {
  children: IElement[];
  joints: Joint[];

  getDataElement(): IDataAssembly;
}

export interface IDataAssembly extends IDataElement {
  children: IDataElement[];
  joints: Joint[];
}

export interface IBar extends IElement {
  fixedPoint: Vector3;
  point: Vector3;
}

export interface IDataBar extends IDataElement {
  fixedPoint: IDataVector3;
  point: IDataVector3;
}

export interface ISpringDumper extends IElement {
  fixedPoint: Vector3;
  point: Vector3;
  dlMin: Millimeter;
  dlMax: Millimeter;
}

export interface IDataSpringDumper extends IDataElement {
  fixedPoint: IDataVector3;
  point: IDataVector3;
  dlMin: Millimeter;
  dlMax: Millimeter;
}

export interface IBody extends IElement {
  fixedPoints: Vector3[];
  points: Vector3[];
}

export interface IDataBody extends IDataElement {
  fixedPoints: IDataVector3[];
  points: IDataVector3[];
}

export interface IAArm extends IBody {
  fixedPoints: [Vector3, Vector3];
  points: AtLeast1<Vector3>;
}

export interface IDataAArm extends IDataElement {
  fixedPoints: IDataVector3[];
  points: IDataVector3[];
}

export interface IBellCrank extends IBody {
  // Axis
  fixedPoints: [Vector3, Vector3];
  // Points
  points: AtLeast2<Vector3>;
}

export interface IDataBellCrank extends IDataElement {
  fixedPoints: IDataVector3[];
  points: IDataVector3[];
}

export interface ITire extends IElement {
  tireCenter: Vector3;
  toLeftBearing: number;
  toRightBearing: number;
  readonly rightBearing: Vector3;
  readonly leftBearing: Vector3;
  readonly diameter: Millimeter;
}

export interface IDataTire extends IDataElement {
  tireCenter: IDataVector3;
  toLeftBearing: number;
  toRightBearing: number;
}

export interface IRackAndPinion extends IElement {
  points: [Vector3, Vector3];
  dlMin: Millimeter;
  dlMax: Millimeter;
  dlPerRad: Radian;
}

export const isElement = (
  element: IElement | IDataElement
): element is IElement => 'getNodes' in element;

export const isDataElement = (
  element: IElement | IDataElement
): element is IDataElement => !('getNodes' in element);

export const isBar = (element: IElement): element is IBar =>
  element.className === 'Bar';
export const isSpringDumper = (element: IElement): element is ISpringDumper =>
  element.className === 'SpringDumper';
export const isTire = (element: IElement): element is ITire =>
  element.className === 'Tire';
export const isAArm = (element: IElement): element is IAArm =>
  element.className === 'AArm';
export const isBody = (element: IElement): element is IBody =>
  element.className === 'Body';
export const isBellCrank = (element: IElement): element is IBellCrank =>
  element.className === 'BellCrank';
export const isAssembly = (element: IElement): element is IAssembly =>
  element.className === 'Assembly';

export const isDataBar = (element: IDataElement): element is IDataBar =>
  element.className === 'Bar';
export const isDataSpringDumper = (
  element: IDataElement
): element is IDataSpringDumper => element.className === 'SpringDumper';
export const isDataTire = (element: IDataElement): element is IDataTire =>
  element.className === 'Tire';
export const isDataAArm = (element: IDataElement): element is IDataAArm =>
  element.className === 'AArm';
export const isDataBody = (element: IDataElement): element is IDataBody =>
  element.className === 'Body';
export const isDataBellCrank = (
  element: IDataElement
): element is IDataBellCrank => element.className === 'BellCrank';
export const isDataAssembly = (
  element: IDataElement
): element is IDataAssembly => element.className === 'Assembly';
