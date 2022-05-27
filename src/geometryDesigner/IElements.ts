import {Vector3, Matrix3, Mesh} from 'three';
import {AtLeast1, AtLeast2} from '@app/utils/atLeast';

export type Radian = number;
export type ElementID = number;
export type NodeID = number;
export type Millimeter = number;
export interface Joint {
  lhs: [ElementID, NodeID];
  rhs: [ElementID, NodeID];
}

export interface NodeWithInfo {
  p: Vector3;
  info: string;
}

export interface IAxis {
  point: Vector3;
  direction: Vector3;
}

export interface IElement {
  readonly className: string;
  name: string;
  inertialTensor: Matrix3;
  mesh?: Mesh;
  readonly nodeID: string;
  getNodes(): NodeWithInfo[];
  getMirror(): IElement;
  // eslint-disable-next-line no-unused-vars
  arrange(parentPosition?: Vector3): void;
  position: Vector3;
  rotation?: Matrix3;
  initialPosition: Vector3;
}

export interface IAssembly extends IElement {
  children: IElement[];
  joints: Joint[];
}

export interface IBar extends IElement {
  fixedPoint: Vector3;
  point: Vector3;
}

export interface ISpringDumper extends IElement {
  fixedPoint: Vector3;
  point: Vector3;
  dlMin: Millimeter;
  dlMax: Millimeter;
}

export interface IBody extends IElement {
  fixedPoints: Vector3[];
  points: Vector3[];
}

export interface IAArm extends IBody {
  fixedPoints: [Vector3, Vector3];
  points: AtLeast1<Vector3>;
}

export interface IBellCrank extends IBody {
  // Axis
  fixedPoints: [Vector3, Vector3];
  // Points
  points: AtLeast2<Vector3>;
}

export interface ITire extends IElement {
  tireCenter: Vector3;
  toLeftBearing: number;
  toRightBearing: number;
  readonly rightBearing: Vector3;
  readonly leftBearing: Vector3;
  readonly diameter: Millimeter;
}

export interface IRackAndPinion extends IElement {
  points: [Vector3, Vector3];
  dlMin: Millimeter;
  dlMax: Millimeter;
  axis: IAxis;
  dlPerRad: Radian;
}

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
