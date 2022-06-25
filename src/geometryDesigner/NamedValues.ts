/* eslint-disable max-classes-per-file */
import {Vector3, Matrix3} from 'three';

/* export interface IData {
  className: string;
}

const isData = (
  params: IDataVector3 | INamedVector3Constructor
): params is IDataVector3 => 'className' in params;
*/

export const isData = (params: any): params is INamedData => 'name' in params;

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
}

export interface INamedValue {
  readonly className: string;
  name: string;
  parent: IElement;
  value: unknown;
  getData(): unknown;
  clone(newValue?: unknown): unknown;
}

interface INamedPrimitiveConstructor<T> {
  name: string;
  value: T | IData<T>;
  parent: IElement;
}

export class NamedPrimitive<T> implements INamedValue {
  className: string;

  name: string;

  value: T;

  parent: IElement;

  constructor(params: INamedPrimitiveConstructor<T>) {
    const {name, value, parent} = params;
    this.className = typeof value;
    this.value = isData(value) ? value.value : value;
    this.name = isData(value) ? value.name : name;
    this.parent = parent;
  }

  getData(): IData<T> {
    return {
      name: this.name,
      value: this.value
    };
  }

  clone(newValue?: T): NamedPrimitive<T> {
    const tmp = new NamedPrimitive<T>({
      name: this.name,
      parent: this.parent,
      value: this.value
    });

    if (newValue) {
      tmp.value = newValue;
    }
    return tmp;
  }
}

interface INamedVector3Constructor {
  name: string;
  parent: IElement;
  value?: Vector3 | IDataVector3;
}

export class NamedVector3 implements INamedValue {
  readonly className: string = 'Vector3';

  name: string;

  value: Vector3;

  parent: IElement;

  constructor(params: INamedVector3Constructor) {
    const {name, parent, value} = params;
    this.parent = parent;
    this.name = name;
    if (value) {
      const {x, y, z} = value;
      this.value = new Vector3(x, y, z);
      if (isData(value)) this.name = value.name;
    } else {
      this.value = new Vector3();
    }
  }

  getData(): IDataVector3 {
    return {
      name: this.name,
      x: this.value.x,
      y: this.value.y,
      z: this.value.z
    };
  }

  clone(newValue?: Vector3 | IDataVector3): NamedVector3 {
    const tmp = new NamedVector3({
      name: this.name,
      parent: this.parent,
      value: this.value.clone()
    });
    if (newValue) {
      if (newValue instanceof Vector3) {
        tmp.value = newValue.clone();
      } else {
        tmp.value = new Vector3(newValue.x, newValue.y, newValue.z);
      }
    }
    return tmp;
  }
}

interface INamedMatrix3Constructor {
  name: string;
  parent: IElement;
  value?: IDataMatrix3 | Matrix3;
}

export class NamedMatrix3 implements INamedValue {
  readonly className: string = 'Matrix3';

  name: string;

  parent: IElement;

  value: Matrix3;

  constructor(params: INamedMatrix3Constructor) {
    const {name, parent, value} = params;
    this.name = name;
    this.parent = parent;
    this.value = new Matrix3();
    if (value) {
      this.value.elements = {...value.elements};
      if (isData(value)) this.name = value.name;
    }
  }

  getData(): IDataMatrix3 {
    const e = this.value.elements;
    return {
      name: this.name,
      elements: [e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]]
    };
  }

  clone(newValue?: Matrix3 | IDataMatrix3): NamedMatrix3 {
    const tmp = new NamedMatrix3({name: this.name, parent: this.parent});
    if (newValue) {
      if (newValue instanceof Matrix3) {
        tmp.value = newValue.clone();
      } else {
        tmp.value = new Matrix3();
        tmp.value.elements = {...newValue.elements};
      }
    }
    return tmp;
  }
}
