import {IDataFormula} from '@gd/IFormula';
import {IElement} from '@gd/IElements';
import {Vector3, Matrix3} from 'three';
import {GDState} from '@store/reducers/dataGeometryDesigner';

export const isData = (params: any): params is INamedData => {
  try {
    return 'name' in params;
  } catch (e: any) {
    return false;
  }
};

export interface INamedData {
  name: string;
}

export interface IData<T> extends INamedData {
  value: T;
}

export interface IDataNumber extends IData<number> {
  formula?: IDataFormula;
}

export interface IDataVector3 extends INamedData {
  x: IDataNumber;
  y: IDataNumber;
  z: IDataNumber;
  pointOffsetTools?: IDataPointOffsetTool[];
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

export interface INamedValue {
  readonly parent: IElement;
  readonly className: string;
  readonly nodeID: string;
  readonly absPath: string;
  name: string;
  value: unknown;
  getData(state: GDState): unknown;
  // update(newValue: unknown): this;
}

export interface INamedNumber extends INamedValue {
  value: number;
  getData(state: GDState): IDataNumber;
  getStringValue(): string;
  setValue(newValue: string | number): void;
}

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

export interface INamedVector3 extends INamedValue {
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

export interface INamedMatrix3 extends INamedValue {
  value: Matrix3;
  getData(state: GDState): IDataMatrix3;
}

export interface IDataPointOffsetTool {
  readonly isDataPointOffsetTool: boolean;
  readonly className: string;
  name: string;
}

export interface IPointOffsetTool {
  readonly isPointOffsetTool: boolean;
  readonly className: string;
  name: string;
  readonly parent: INamedVector3;
  getOffsetVector(): {dx: number; dy: number; dz: number};
  getData(state: GDState): IDataPointOffsetTool;
}
