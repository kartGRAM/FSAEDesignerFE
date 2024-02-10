import {Matrix} from 'ml-matrix';
import {IConstant} from './IConstant';
import {IVector3} from './IVector3';
import {Vector3Like, getVVector} from './Functions';
import {Vector3Base} from './Vector3Base';

export class ConstantVector3
  extends Vector3Base
  implements IVector3, IConstant
{
  readonly isVector3 = true;

  readonly isConstant = true;

  readonly value: Matrix;

  // eslint-disable-next-line class-methods-use-this
  diff(): void {}

  constructor(value: Matrix | Vector3Like) {
    super();
    if ('x' in value) {
      this.value = getVVector(value);
    } else {
      if (value.rows !== 3 || value.columns !== 3)
        throw new Error('Vector3じゃない');
      this.value = value;
    }
  }
}
