import {IDataFormula, IFormula} from '@gd/IFormula';
import {Vector3, Matrix3, Quaternion} from 'three';
import {GDState} from '@store/reducers/dataGeometryDesigner';
import {INode, IBidirectionalNode} from './INode';

export type FunctionVector3 = {
  x: number | string;
  y: number | string;
  z: number | string;
};

export function isFunctionVector3(vec: any): vec is FunctionVector3 {
  try {
    const {x, y, z} = vec;
    const xt = typeof x === 'number' || typeof x === 'string';
    const yt = typeof y === 'number' || typeof y === 'string';
    const zt = typeof z === 'number' || typeof z === 'string';
    return xt && yt && zt;
  } catch {
    return false;
  }
}

export interface INamedValue extends IBidirectionalNode {
  isNamedValue: true;
  parent: IBidirectionalNode | null;
  readonly className: string;
  readonly nodeID: string;
  readonly absPath: string;
  name: string;
  value: unknown;
  getData(state: GDState): unknown;
  meta?: unknown;
  // update(newValue: unknown): this;
}

export const isNamedValue = (params: any): params is INamedValue => {
  try {
    return 'isNamedValue' in params;
  } catch (e) {
    return false;
  }
};

export interface INamedData extends INode {
  isNamedData: true;
  name: string;
}

export const isNamedData = (params: any): params is INamedData => {
  try {
    return 'isNamedData' in params;
  } catch (e) {
    return false;
  }
};

export interface INamedString extends INamedValue {
  value: string;
  getData(state: GDState): IData<string>;
}

export interface INamedBoolean extends INamedValue {
  value: boolean;
  getData(state: GDState): IData<boolean>;
}

export interface INamedBooleanOrUndefined extends INamedValue {
  value: boolean | undefined;
  getData(state: GDState): IData<boolean | undefined>;
}

export interface IData<T> extends INamedData {
  value: T;
}

export interface INamedNumberRO extends Omit<INamedValue, 'getData'> {
  value: number;
}

export interface INamedNumber extends INamedNumberRO {
  value: number;
  formula: IFormula;
  getData(state: GDState): IDataNumber;
  getStringValue(): string;
  setValue(newValue: string | number): INamedValue;
}

export function isNamedNumber(value: any): value is INamedNumber {
  if (isNamedValue(value)) {
    return value.className === 'NamedNumber';
  }
  return false;
}
export interface IDataNumber extends IData<IDataFormula> {}

export interface INamedNumberLW extends INamedNumberRO {
  value: number;
  getData(state: GDState): IDataNumberLW;
}

export function isNamedNumberLW(value: any): value is INamedNumberLW {
  if (isNamedValue(value)) {
    return value.className === 'NamedNumberLW';
  }
  return false;
}

export interface IDataNumberLW extends IData<number> {}

export interface IMetaNamedVector3 {
  mirrorTo?: string;
  isFreeNode?: boolean;
}

export interface INamedVector3RO extends Omit<INamedValue, 'getData'> {
  readonly x: INamedNumberRO;
  readonly y: INamedNumberRO;
  readonly z: INamedNumberRO;
  value: Vector3;
  meta: IMetaNamedVector3;
}

export function isNamedVector3RO(value: any): value is INamedVector3RO {
  return isNamedVector3LW(value) || isNamedVector3(value);
}

export interface INamedVector3LW extends INamedVector3RO {
  readonly x: INamedNumberLW;
  readonly y: INamedNumberLW;
  readonly z: INamedNumberLW;
  value: Vector3;
  getData(state: GDState): IDataVector3LW;
}

export function isNamedVector3LW(value: any): value is INamedVector3LW {
  if (isNamedValue(value)) return value.className === 'NamedVector3';
  return false;
}

export interface IDataVector3LW extends INamedData {
  x: IDataNumberLW;
  y: IDataNumberLW;
  z: IDataNumberLW;
  mirrorTo?: string;
  isFreeNode?: boolean;
}

export interface INamedVector3 extends INamedVector3RO {
  readonly x: INamedNumber;
  readonly y: INamedNumber;
  readonly z: INamedNumber;
  value: Vector3;
  getData(state: GDState): IDataVector3;
  setValue(
    newValue:
      | {
          x: number | string;
          y: number | string;
          z: number | string;
        }
      | INamedVector3
  ): INamedVector3;
  getStringValue(): {
    x: number | string;
    y: number | string;
    z: number | string;
  };
  pointOffsetTools: IPointOffsetTool[];
}

export function isNamedVector3(value: any): value is INamedVector3 {
  if (isNamedValue(value)) return value.className === 'NamedVector3';
  return false;
}

export interface IDataVector3 extends INamedData {
  x: IDataNumber;
  y: IDataNumber;
  z: IDataNumber;
  pointOffsetTools?: IDataPointOffsetTool[];
  mirrorTo?: string;
  isFreeNode?: boolean;
}

export interface INamedMatrix3 extends INamedValue {
  value: Matrix3;
  getData(state: GDState): IDataMatrix3;
}

export function isNamedMatrix3(value: any): value is INamedMatrix3 {
  if (isNamedValue(value)) return value.className === 'Matrix3';
  return false;
}

export interface IDataMatrix3 extends INamedData {
  elements: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
  ];
}

export interface INamedQuaternion extends INamedValue {
  value: Quaternion;
  getData(state: GDState): IDataQuaternion;
}

export function isNamedQuaternion(value: any): value is INamedQuaternion {
  if (isNamedValue(value)) return value.className === 'Quaternion';
  return false;
}

export interface IDataQuaternion extends INamedData {
  w: number;
  x: number;
  y: number;
  z: number;
}

export interface IDataPointOffsetTool extends INode {
  readonly isDataPointOffsetTool: true;
  readonly className: string;
  readonly absPath: string;
  readonly nodeID: string;
  name: string;
}

export function isDataPointOffsetTool(tool: any): tool is IDataPointOffsetTool {
  try {
    return 'isDataPointOffsetTool' in tool;
  } catch (e) {
    return false;
  }
}

export interface IPointOffsetTool extends IBidirectionalNode {
  name: string;
  readonly isPointOffsetTool: true;
  readonly className: string;
  readonly absPath: string;
  readonly nodeID: string;
  readonly parent: INamedVector3;
  getOffsetVector(): {dx: number; dy: number; dz: number};
  copy(newParent: INamedVector3): IPointOffsetTool;
  getData(state: GDState): IDataPointOffsetTool;
}
