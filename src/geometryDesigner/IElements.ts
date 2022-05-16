import {Vector3, Matrix3, Mesh} from 'three';

export type Radian = number;
export type ElementID = number;
export type LinkID = number;
export type Millimeter = number;
export interface Joint {
  lhs: [ElementID, LinkID];
  rhs: [ElementID, LinkID];
}

export interface PointWithInfo {
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
  getPoints(): PointWithInfo[];
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
  points: Vector3[];
}

export interface IBellCrank extends IBody {
  // Axis
  fixedPoints: [Vector3, Vector3];
  // Points
  points: Vector3[];
}

export interface ITire extends IElement {
  tireCenter: Vector3;
  toLeftBearing: number;
  toRightBearing: number;
  readonly diameter: Millimeter;
}

export interface IRackAndPinion extends IElement {
  points: [Vector3, Vector3];
  dlMin: Millimeter;
  dlMax: Millimeter;
  axis: IAxis;
  dlPerRad: Radian;
}
