import {AtLeast1, AtLeast2} from '@app/utils/atLeast';
import {Vector3} from 'three';
import {
  IDataVector3,
  IDataMatrix3,
  IData,
  INamedVector3,
  INamedMatrix3,
  INamedString,
  INamedNumber,
  INamedBooleanOrUndefined
} from '@gd/INamedValues';
import {GDState} from '@store/reducers/dataGeometryDesigner';
import {INode, IBidirectionalNode} from './INode';

export type Radian = number;
export type NodeID = string;
export type Millimeter = number;
export interface Joint {
  lhs: INamedVector3;
  rhs: INamedVector3;
}
export interface DataJoint {
  lhs: NodeID;
  rhs: NodeID;
}

export function getElementByPath(
  root: IAssembly | undefined | null,
  path: string
): IElement | null {
  if (root?.parent) throw new Error('root以外が使用してはいけない');
  return getElementByPathCore(root, path) as IElement | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getDataElementByPath(
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

export const isMirrorElement = (element: IElement): boolean => {
  return !!element.meta?.mirror;
};

export interface IElement extends IBidirectionalNode {
  readonly isElement: true;
  readonly className: string;
  readonly name: INamedString;
  readonly inertialTensor: INamedMatrix3;
  readonly mass: INamedNumber;
  readonly centerOfGravity: INamedVector3;
  readonly visible: INamedBooleanOrUndefined;
  parent: IAssembly | null;
  readonly nodeID: string;
  readonly absPath: string;
  getPoints(): INamedVector3[];
  getMirror(): IElement;
  getRoot(): IAssembly | null;
  getDataElement(state: GDState): IDataElement;
  arrange(parentPosition?: Vector3): void;
  readonly position: INamedVector3;
  readonly rotation: INamedMatrix3;
  readonly initialPosition: INamedVector3;
  meta?: Meta;
}

export interface IDataElement extends INode {
  isDataElement: true;
  className: string;
  name: IData<string>;
  nodeID: string;
  absPath: string;
  visible: IData<boolean | undefined>;

  mass: IData<number>;
  centerOfGravity: IDataVector3;
  inertialTensor: IDataMatrix3;
  position: IDataVector3;
  rotation: IDataMatrix3;
  initialPosition: IDataVector3;

  mirrorTo?: string;
}

export interface IAssembly extends IElement {
  isAssembly: true;
  children: IElement[];
  joints: Joint[];
  getJointedPoints(): INamedVector3[];
  getJointsRecursive(): Joint[];

  getDataElement(state: GDState): IDataAssembly;
}

export interface IDataAssembly extends IDataElement {
  isDataAssembly: true;
  children: IDataElement[];
  joints: DataJoint[];
}

export interface IBar extends IElement {
  readonly fixedPoint: INamedVector3;
  readonly point: INamedVector3;
}

export interface IDataBar extends IDataElement {
  fixedPoint: IDataVector3;
  point: IDataVector3;
}

export interface ISpringDumper extends IElement {
  readonly fixedPoint: INamedVector3;
  readonly point: INamedVector3;
  readonly dlMin: INamedNumber;
  readonly dlMax: INamedNumber;
}

export interface IDataSpringDumper extends IDataElement {
  fixedPoint: IDataVector3;
  point: IDataVector3;
  dlMin: IData<Millimeter>;
  dlMax: IData<Millimeter>;
}

export interface IBody extends IElement {
  readonly fixedPoints: INamedVector3[];
  readonly points: INamedVector3[];
}

export interface IDataBody extends IDataElement {
  fixedPoints: IDataVector3[];
  points: IDataVector3[];
}

export interface IAArm extends IBody {
  readonly fixedPoints: [INamedVector3, INamedVector3];
  readonly points: AtLeast1<INamedVector3>;
}

export interface IDataAArm extends IDataElement {
  fixedPoints: IDataVector3[];
  points: IDataVector3[];
}

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

export interface ITire extends IElement {
  readonly tireCenter: INamedVector3;
  readonly toLeftBearing: INamedNumber;
  readonly toRightBearing: INamedNumber;
  readonly rightBearing: INamedVector3;
  readonly leftBearing: INamedVector3;
  readonly diameter: Millimeter;
}

export interface IDataTire extends IDataElement {
  tireCenter: IDataVector3;
  toLeftBearing: IData<number>;
  toRightBearing: IData<number>;
  leftBearingNodeID: string;
  rightBearingNodeID: string;
}

export interface IRackAndPinion extends IElement {
  points: [Vector3, Vector3];
  dlMin: Millimeter;
  dlMax: Millimeter;
  dlPerRad: Radian;
}

export interface IFrame extends IAssembly {}

export interface IDataFrame extends IDataAssembly {
  bodyID: string;
}

export interface Meta {
  isBodyOfFrame?: true;
  mirror?: MetaMirror;
}

export interface MetaMirror {
  to: string;
}

export function assignMeta(to: IElement, meta: Meta) {
  to.meta = to.meta ? {...to.meta, ...meta} : {...meta};
}

export const isElement = (
  element: INode | null | undefined
): element is IElement => {
  if (!element) return false;
  return 'isElement' in element;
};
export const isAssembly = (element: IElement): element is IAssembly =>
  'isAssembly' in element;

export const isDataElement = (element: INode): element is IDataElement =>
  'isDataElement' in element;

export const isDataAssembly = (
  element: IDataElement
): element is IDataAssembly => 'isDataAssembly' in element;

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
export const isFrame = (element: IAssembly): element is IFrame =>
  element.className === 'Frame';

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

export const isDataFrame = (element: IDataAssembly): element is IDataFrame =>
  element.className === 'Frame';
