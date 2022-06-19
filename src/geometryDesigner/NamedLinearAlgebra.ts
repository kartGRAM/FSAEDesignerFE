/* eslint-disable max-classes-per-file */
import {Vector3 as TV3, Matrix3 as TM3} from 'three';
import {IElement, IDataVector3, IDataMatrix3} from '@gd/IElements';

interface INamedLinearAlgebla {
  name: string;
  parent: IElement;
  gatData(): INamedLinearAlgebla;
}

export class Vector3 extends TV3 implements INamedLinearAlgebla {
  name: string;

  parent: IElement;

  constructor(
    name: string,
    parent: IElement,
    x?: number,
    y?: number,
    z?: number
  ) {
    super(x, y, z);
    this.parent = parent;
    this.name = name;
  }

  getData(): IDataVector3 {
    return {
      absPath: `${this.name}@${this.parent.absPath}`,
      x: this.x,
      y: this.y,
      z: this.z
    };
  }
}

export class Matrix3 extends TM3 implements INamedLinearAlgebla {
  parent: IElement;

  name: string;

  constructor(name: string, parent: IElement) {
    super();
    this.parent = parent;
    this.name = name;
  }

  getData(): IDataMatrix3 {
    const e = this.elements;
    return {
      absPath: `${this.name}@${this.parent.absPath}`,
      elements: [e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]]
    };
  }
}
