/* eslint-disable max-classes-per-file */
import {Vector3, Matrix3} from 'three';
import {IElement} from '@gd/IElements';

/* export interface IData {
  className: string;
}

const isData = (
  params: IDataVector3 | INamedVector3Constructor
): params is IDataVector3 => 'className' in params;
*/

export interface IDataVector3 {
  x: number;
  y: number;
  z: number;
}

export interface IDataMatrix3 {
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

interface INamedValue {
  readonly className: string;
  name: string;
  parent: IElement;
  value: any;
  getData(): any;
}

interface INamedPrimitiveConstructor<T> {
  name: string;
  value: T;
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
    this.value = value;
    this.name = name;
    this.parent = parent;
  }

  getData(): T {
    return this.value;
  }
}

interface INamedVector3Constructor {
  name: string;
  parent: IElement;
  data?: IDataVector3;
  x?: number;
  y?: number;
  z?: number;
}

export class NamedVector3 implements INamedValue {
  readonly className: string = 'Vector3';

  name: string;

  value: Vector3;

  parent: IElement;

  constructor(params: INamedVector3Constructor) {
    const {name, parent, data, x, y, z} = params;
    this.parent = parent;
    this.name = name;
    if (data) {
      const {x, y, z} = data;
      this.value = new Vector3(x, y, z);
    } else {
      this.value = new Vector3(x, y, z);
    }
  }

  getData(): IDataVector3 {
    return {
      x: this.value.x,
      y: this.value.y,
      z: this.value.z
    };
  }
}

interface INamedMatrix3Constructor {
  name: string;
  parent: IElement;
  data?: IDataMatrix3;
}

export class NamedMatrix3 implements INamedValue {
  readonly className: string = 'Matrix3';

  name: string;

  parent: IElement;

  value: Matrix3;

  constructor(params: INamedMatrix3Constructor) {
    const {name, parent, data} = params;
    this.name = name;
    this.parent = parent;
    this.value = new Matrix3();
    if (data) {
      this.value.elements = {...data.elements};
    }
  }

  getData(): IDataMatrix3 {
    const e = this.value.elements;
    return {
      elements: [e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]]
    };
  }
}
