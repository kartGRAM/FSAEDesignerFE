import {IDataFormula, IFormula} from '@gd/IFormula';
import {Vector3, Matrix3} from 'three';
import {GDState} from '@store/reducers/dataGeometryDesigner';
import {INode, IBidirectionalNode} from './INode';

export type FunctionVector3 = {
  x: number | string;
  y: number | string;
  z: number | string;
};

export interface INamedValue extends IBidirectionalNode {
  isNamedValue: true;
  parent: IBidirectionalNode | null;
  readonly className: string;
  readonly nodeID: string;
  readonly absPath: string;
  name: string;
  value: unknown;
  getData(state: GDState): unknown;
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

export interface INamedNumber extends INamedValue {
  value: number;
  formula?: IFormula;
  getData(state: GDState): IDataNumber;
  getStringValue(): string;
  setValue(newValue: string | number): void;
}

export interface IDataNumber extends IData<number> {
  formula?: IDataFormula;
}

export interface INamedVector3 extends INamedValue {
  readonly x: INamedNumber;
  readonly y: INamedNumber;
  readonly z: INamedNumber;
  value: Vector3;
  getData(state: GDState): IDataVector3;
  setStringValue(newValue: {
    x: number | string;
    y: number | string;
    z: number | string;
  }): void;
  getStringValue(): {
    x: number | string;
    y: number | string;
    z: number | string;
  };
  pointOffsetTools?: IPointOffsetTool[];
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
}

export interface INamedMatrix3 extends INamedValue {
  value: Matrix3;
  getData(state: GDState): IDataMatrix3;
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
