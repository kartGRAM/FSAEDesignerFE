/* eslint-disable max-classes-per-file */
import {Vector3, Matrix3} from 'three';

/* export interface IData {
  className: string;
}

const isData = (
  params: IDataVector3 | INamedVector3Constructor
): params is IDataVector3 => 'className' in params;
*/

export const isData = (params: any): params is INamedData => {
  try {
    return 'name' in params;
  } catch (e: any) {
    return false;
  }
};

export const getVector3 = (data: IDataVector3): Vector3 => {
  return new Vector3(data.x, data.y, data.z);
};
export const getDataVector3 = (value: Vector3): IDataVector3 => {
  const {x, y, z} = value;
  return {x, y, z, name: 'tempData'};
};
export const getMatrix3 = (data: IDataMatrix3): Matrix3 => {
  const tmp = new Matrix3();
  tmp.elements = [...data.elements];
  return tmp;
};

export interface INamedData {
  name: string;
}

export interface IData<T> extends INamedData {
  value: T;
}

export interface IDataVector3 extends INamedData {
  x: number;
  y: number;
  z: number;
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

interface IElement {
  readonly absPath: string;
  registerNamedValue<T extends INamedValue>(value: T, override?: boolean): void;
}

export interface INamedValue {
  readonly className: string;
  name: string;
  parent: IElement;
  value: unknown;
  getData(): unknown;
}

interface INamedPrimitiveConstructor<T> {
  name: string;
  value: T | IData<T>;
  parent: IElement;
  override?: boolean;
}

export class NamedPrimitive<T> implements INamedValue {
  className: string;

  name: string;

  value: T;

  parent: IElement;

  constructor(params: INamedPrimitiveConstructor<T>) {
    const {name, value, parent, override} = params;
    this.className = typeof value;
    this.value = isData(value) ? value.value : value;
    this.name = isData(value) ? value.name : name;
    this.parent = parent;
    parent.registerNamedValue(this, override);
  }

  getData(): IData<T> {
    return {
      name: this.name,
      value: this.value
    };
  }
}

export class NamedBooleanOrUndefined implements INamedValue {
  readonly className: string = 'boolean|undefined';

  name: string;

  value: boolean | undefined;

  parent: IElement;

  constructor(params: INamedPrimitiveConstructor<boolean | undefined>) {
    const {name, value, parent, override} = params;
    this.value = isData(value) ? value.value : value;
    this.name = isData(value) ? value.name : name;
    this.parent = parent;
    parent.registerNamedValue(this, override);
  }

  getData(): IData<boolean | undefined> {
    return {
      name: this.name,
      value: this.value
    };
  }
}

interface INamedVector3Constructor {
  name: string;
  parent: IElement;
  value?: Vector3 | IDataVector3;
  override?: boolean;
}

export class NamedVector3 implements INamedValue {
  readonly className: string = 'Vector3';

  name: string;

  value: Vector3;

  parent: IElement;

  constructor(params: INamedVector3Constructor) {
    const {name, parent, value, override} = params;
    this.parent = parent;
    this.name = name;
    if (value) {
      const {x, y, z} = value;
      this.value = new Vector3(x, y, z);
      if (isData(value)) this.name = value.name;
    } else {
      this.value = new Vector3();
    }
    parent.registerNamedValue(this, override);
  }

  getData(): IDataVector3 {
    return {
      name: this.name,
      x: this.value.x,
      y: this.value.y,
      z: this.value.z
    };
  }
}

interface INamedMatrix3Constructor {
  name: string;
  parent: IElement;
  value?: IDataMatrix3 | Matrix3;
  override?: boolean;
}

export class NamedMatrix3 implements INamedValue {
  readonly className: string = 'Matrix3';

  name: string;

  parent: IElement;

  value: Matrix3;

  constructor(params: INamedMatrix3Constructor) {
    const {name, parent, value, override} = params;
    this.name = name;
    this.parent = parent;
    this.value = new Matrix3();
    if (value) {
      this.value.elements = {...value.elements};
      if (isData(value)) this.name = value.name;
    }
    parent.registerNamedValue(this, override);
  }

  getData(): IDataMatrix3 {
    const e = this.value.elements;
    return {
      name: this.name,
      elements: [e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]]
    };
  }
}
