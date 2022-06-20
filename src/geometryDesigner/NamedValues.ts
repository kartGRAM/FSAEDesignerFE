/* eslint-disable max-classes-per-file */
import {Vector3 as TV3, Matrix3 as TM3} from 'three';

export interface INamedData {
  absPath: string;
}

export interface IDataPrimitive<T> extends INamedData {
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

interface IPartialElement {
  readonly absPath: string;
}

interface INamedValue {
  readonly className: string;
  name: string;
  // eslint-disable-next-line no-unused-vars
  getData(parent: IPartialElement): INamedData;
}

interface IPrimitiveConstructor<T> {
  name: string;
  value: T;
}

export class Primitive<T> implements INamedValue {
  className: string;

  name: string;

  value: T;

  private isData = (
    params: IDataPrimitive<T> | IPrimitiveConstructor<T>
  ): params is IDataPrimitive<T> => 'absPath' in params;

  constructor(params: IPrimitiveConstructor<T> | IDataPrimitive<T>) {
    this.className = typeof params.value;
    this.value = params.value;
    if (this.isData(params)) {
      const path = params.absPath.split('@');
      this.name = path.pop()!;
    } else {
      const {name} = params;
      this.name = name;
    }
  }

  getData(parent: IPartialElement): IDataPrimitive<T> {
    return {
      absPath: `${this.name}@${parent.absPath}`,
      value: this.value
    };
  }
}

interface IVector3Constructor {
  name: string;
  x?: number;
  y?: number;
  z?: number;
}

export class Vector3 extends TV3 implements INamedValue {
  readonly className: string = 'Vector3';

  name: string;

  private isData = (
    params: IDataVector3 | IVector3Constructor
  ): params is IDataVector3 => 'absPath' in params;

  constructor(params: IDataVector3 | IVector3Constructor) {
    const {x, y, z} = params;
    super(x, y, z);
    if (this.isData(params)) {
      const path = params.absPath.split('@');
      this.name = path.pop()!;
    } else {
      const {name} = params;
      this.name = name;
    }
  }

  getData(parent: IPartialElement): IDataVector3 {
    return {
      absPath: `${this.name}@${parent.absPath}`,
      x: this.x,
      y: this.y,
      z: this.z
    };
  }

  clone(): this {
    const params: IVector3Constructor = {
      name: this.name,
      x: this.x,
      y: this.y,
      z: this.z
    };
    return new Vector3(params) as this;
  }
}

interface IMatrix3Constructor {
  name: string;
}

export class Matrix3 extends TM3 implements INamedValue {
  readonly className: string = 'Matrix3';

  name: string;

  private isData = (
    params: IDataMatrix3 | IMatrix3Constructor
  ): params is IDataMatrix3 => 'absPath' in params;

  constructor(params: IDataMatrix3 | IMatrix3Constructor) {
    super();
    if (this.isData(params)) {
      this.name = params.absPath.split('@').pop()!;
      this.elements = {...params.elements};
    } else {
      const {name} = params;
      this.name = name;
    }
  }

  getData(parent: IPartialElement): IDataMatrix3 {
    const e = this.elements;
    return {
      absPath: `${this.name}@${parent.absPath}`,
      elements: [e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]]
    };
  }

  clone(): this {
    const params: IMatrix3Constructor = {
      name: this.name
    };
    const mat = new Matrix3(params);
    mat.elements = {...this.elements};
    return mat as this;
  }
}
