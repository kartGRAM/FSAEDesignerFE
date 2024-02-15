import {Matrix} from 'ml-matrix';
import * as Three from 'three';
import {IConstant} from './IConstant';
import {IVector3} from './IVector3';
import {Vector3Base} from './Vector3';
import {Vector3Like, getVVector} from './Functions';

export class ConstantVector3
  extends Vector3Base
  implements IVector3, IConstant
{
  readonly isConstant = true;

  value: Matrix;

  // eslint-disable-next-line class-methods-use-this
  diff(): void {}

  // eslint-disable-next-line class-methods-use-this
  reset() {
    return -1;
  }

  // eslint-disable-next-line class-methods-use-this
  setJacobian() {}

  setValue(value: Vector3Like | Matrix) {
    if ('x' in value) {
      this.value = getVVector(value);
    } else {
      if (value.rows !== 3 || value.columns !== 3)
        throw new Error('Vector3じゃない');
      this.value = value;
    }
  }

  constructor(value?: Matrix | Vector3Like) {
    super(() => {});
    if (!value) this.value = getVVector(new Three.Vector3());
    else if ('x' in value) {
      this.value = getVVector(value);
    } else {
      if (value.rows !== 3 || value.columns !== 3)
        throw new Error('Vector3じゃない');
      this.value = value;
    }
  }
}
