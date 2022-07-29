import {IDataFormula} from '@gd/DataFormula';
import {IElement} from '@gd/IElements';
import {Vector3, Matrix3} from 'three';

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
  getData(): unknown;
  // update(newValue: unknown): this;
}

export interface INamedNumber extends INamedValue {
  value: number;
  getData(): IDataNumber;
}

export interface INamedString extends INamedValue {
  value: string;
  getData(): IData<string>;
}

export interface INamedBoolean extends INamedValue {
  value: boolean;
  getData(): IData<boolean>;
}

export interface INamedBooleanOrUndefined extends INamedValue {
  value: boolean | undefined;
  getData(): IData<boolean | undefined>;
}

export interface INamedVector3 extends INamedValue {
  value: Vector3;
  getData(): IDataVector3;
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
}

export interface INamedMatrix3 extends INamedValue {
  value: Matrix3;
  getData(): IDataMatrix3;
}
