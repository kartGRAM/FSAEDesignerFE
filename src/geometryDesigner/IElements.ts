import {Vector3, Matrix3, Quaternion} from 'three';
import {
  IDataVector3,
  IDataVector3LW,
  IDataMatrix3,
  IDataQuaternion,
  IData,
  IDataNumber,
  INamedVector3,
  INamedVector3RO,
  INamedVector3LW,
  INamedMatrix3,
  INamedQuaternion,
  INamedString,
  INamedNumber,
  INamedNumberRO,
  INamedBooleanOrUndefined,
  INamedBoolean
} from '@gd/INamedValues';
import {isObject} from '@utils/helpers';
import {INode, IBidirectionalNode, getRootNode} from './INode';
import {isBar, IBar} from './IElements/IBar';
import {isSpringDumper, ISpringDumper} from './IElements/ISpringDumper';
import {isTorsionSpring, ITorsionSpring} from './IElements/ITorsionSpring';
import {isLinearBushing, ILinearBushing} from './IElements/ILinearBushing';
import {
  IAssembly,
  IDataAssembly,
  isAssembly,
  isDataAssembly
} from './IElements/IAssembly';

export type {IAssembly, IDataAssembly};
export {isAssembly, isDataAssembly};

export type NodeID = string;

export type Radian = number;

export type Elements =
  | 'Assembly'
  | 'Bar'
  | 'Frame'
  | 'SpringDumper'
  | 'AArm'
  | 'BellCrank'
  | 'Body'
  | 'Tire'
  | 'LinearBushing'
  | 'TorsionSpring';

export interface IMovingElement {
  readonly nodeID: string;
  dlCurrent: number;
  readonly unit: string;
  readonly name: INamedString;
}

export function isMovingElement(element: any): element is IMovingElement {
  return isObject(element) && 'dlCurrent' in element;
}

export function getElementByPath(
  root: IAssembly | undefined | null,
  path: string
): IElement | null {
  if (root?.parent) throw new Error('root以外が使用してはいけない');
  const pathSplited = path.split('@');
  return getElementByPathCore(root, pathSplited) as IElement | null;
}

function getElementByPathCore(
  root: IAssembly /* | IDataAssembly */ | undefined | null,
  path: string[]
): IElement | IDataElement | null {
  if (!root || !path.length) return null;

  // rootノードが異なる
  if (path[path.length - 1] !== root.nodeID) return null;

  // 自分自身が探索対象
  if (path.length === 1) {
    if (root.nodeID === path[0]) return root;
    return null;
  }

  const childrenPath = path.slice(0, -1);

  let element: IElement | IDataElement | null = null;
  for (const child of root.children) {
    if (isElement(child) && isAssembly(child)) {
      element = getElementByPathCore(child, childrenPath);
      if (element != null) return element;
      /* } else if (isDataElement(child) && isDataAssembly(child)) {
      element = getElementByPathCore(child, childrenPath);
      if (element != null) return element; */
    } else if (childrenPath.length === 1 && child.nodeID === childrenPath[0]) {
      return child;
    }
  }
  return element;
}

export function getDataElementByID(
  root: IDataElement | undefined | null,
  id: string
): IDataElement | undefined {
  if (!root) return undefined;
  if (root.nodeID === id) return root;
  if (isDataAssembly(root))
    return root.children.find((child) => getDataElementByID(child, id));
  return undefined;
}

export const isMirrorElement = (element: IElement): boolean => {
  return !!element.meta?.mirror;
};

export const transQuaternion = (
  q: Quaternion,
  coMatrix: Matrix3
): Quaternion => {
  const v = new Vector3(q.x, q.y, q.z).applyMatrix3(coMatrix);
  return new Quaternion(v.x, v.y, v.z, q.w);
};

export const trans = (p: INamedVector3RO, coMatrix?: Matrix3): Vector3 => {
  const {parent} = p;
  let v = p.value;
  if (isElement(parent)) {
    v = parent.position.value
      .clone()
      .add(v.applyQuaternion(parent.rotation.value));
  }
  if (coMatrix) v.applyMatrix3(coMatrix);
  return v;
};

export interface IElement extends IBidirectionalNode {
  readonly isElement: true;
  readonly className: Elements;
  readonly name: INamedString;
  readonly inertialTensor: INamedMatrix3;
  readonly mass: INamedNumber;
  readonly centerOfGravity: INamedVector3;
  readonly autoCalculateCenterOfGravity: INamedBoolean;
  readonly visible: INamedBooleanOrUndefined;
  parent: IAssembly | null;
  readonly controllable?: boolean;
  readonly nodeID: string;
  readonly absPath: string;
  setCenterOfGravityAuto(): void;
  getPoints(): INamedVector3RO[];
  getVariables(): INamedNumberRO[];
  getMeasurablePoints(): INamedVector3RO[];
  getPointsNodeIDs(): string[];
  getMirror(): IElement;
  unlinkMirror(): void;
  getRoot(): IAssembly | null;
  getDataElement(): IDataElement | undefined;
  arrange(parentPosition?: Vector3): void;
  readonly position: INamedVector3LW;
  readonly rotation: INamedQuaternion;
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
  autoCalculateCenterOfGravity: IData<boolean>;

  mass: IDataNumber;
  centerOfGravity: IDataVector3;
  inertialTensor: IDataMatrix3;
  position: IDataVector3LW;
  rotation: IDataQuaternion;
  initialPosition: IDataVector3;

  mirrorTo?: string;
  isBodyOfFrame?: boolean;
}

export interface Meta {
  isBodyOfFrame?: true;
  mirror?: MetaMirror;
}

export interface MetaMirror {
  to: string;
}

export const isBodyOfFrame = (element: IElement) => {
  return Boolean(element.meta?.isBodyOfFrame);
};

export function assignMeta(to: IElement, meta: Meta) {
  to.meta = to.meta ? {...to.meta, ...meta} : {...meta};
}

export const isMirrorData = (element: IDataElement) => {
  return 'mirrorTo' in element;
};

export const isMirror = (element: IElement | null | undefined): boolean => {
  if (!element) return false;
  return !!element.meta?.mirror;
};

export const isElement = (element: any): element is IElement => {
  return isObject(element) && element.isElement;
};
export class MirrorError extends Error {}

export const isDataElement = (params: any): params is IDataElement => {
  return isObject(params) && params.isDataElement;
};

export const isSimplifiedElement = (
  element: any
): element is
  | IBar /* | ITire */
  | ISpringDumper
  | ITorsionSpring
  | ILinearBushing => {
  if (!isElement(element)) return false;
  if (isBar(element)) return true;
  if (isSpringDumper(element)) return true;
  if (isTorsionSpring(element)) return true;
  if (isLinearBushing(element)) return true;
  // if (isTire(element)) return true;
  return false;
};

export const getRootAssembly = (node: IBidirectionalNode) => {
  const root = getRootNode(node);
  if (root && isElement(root) && isAssembly(root)) {
    try {
      return root.getDataElement();
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.log(e);
      return undefined;
    }
  }
  return undefined;
};
