/* eslint-disable max-classes-per-file */
import {Vector3 as TV3, Matrix3 as TM3} from 'three';
import {IElement} from '@gd/IElements';

export interface IDataLinearAlgebra {
  absPath: string;
}

export interface IDataVector3 extends IDataLinearAlgebra {
  x: number;
  y: number;
  z: number;
}

export interface IDataMatrix3 extends IDataLinearAlgebra {
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

interface INamedLinearAlgebla {
  readonly className: string;
  name: string;
  // eslint-disable-next-line no-unused-vars
  getData(parent: IElement): IDataLinearAlgebra;
}

interface IVector3Constructor {
  name: string;
  x?: number;
  y?: number;
  z?: number;
}

export class Vector3 extends TV3 implements INamedLinearAlgebla {
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

  getData(parent: IElement): IDataVector3 {
    return {
      absPath: `${this.name}@${parent.absPath}`,
      x: this.x,
      y: this.y,
      z: this.z
    };
  }
}

interface IMatrix3Constructor {
  name: string;
}

export class Matrix3 extends TM3 implements INamedLinearAlgebla {
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

  getData(parent: IElement): IDataMatrix3 {
    const e = this.elements;
    return {
      absPath: `${this.name}@${parent.absPath}`,
      elements: [e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]]
    };
  }
}
