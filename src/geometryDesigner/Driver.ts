/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {Matrix} from 'ml-matrix';
import {IAssembly, IElement, isElement} from '@gd/IElements';
import {INamedVector3} from '@gd/INamedValues';
import {Vector3} from 'three';
import {
  getPartialDiffOfRotationMatrix,
  setSubMatrix
} from '@gd/KinematicFunctions';

export interface IObjectiveFunction {
  getGradient(assembly: IAssembly): number[];
}
const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;
const Q1 = 4;
const Q2 = 5;
const Q3 = 6;

export class movePointTo implements IObjectiveFunction {
  point: INamedVector3;

  element: IElement;

  target: Vector3;

  constructor(point: INamedVector3, target: Vector3) {
    this.point = point;
    this.target = target;
    if (!isElement(point.parent)) throw new Error('pointの親がElementじゃない');
    this.element = point.parent;
  }

  getGradient(assembly: IAssembly): number[] {
    /*
    枠Oでの点wまでの距離を最小化する
    f = {(p + As - w)T}・(p + As - w);
         = p^2 + s^2 + w^2 + 2p・As - 2p・w - 2w・As

    δf = (2p +2As -2w)Tδp + (2p-2w)・δAs
       = (2p + 2As - 2w)Tδp + (2p-2w)T・(As~・G)δq
    */
    const {children} = assembly;
    const indices = children.reduce(
      (prev: {[index: string]: number}, current, idx) => {
        prev[current.nodeID] = idx * 7;
        return prev;
      },
      {}
    );
    const numGeneralizedCoordinates = children.length * 7; // OKオイラーパラメータ4+XYZ
    const idx = indices[this.element.nodeID];

    const gradient = new Array<number>(numGeneralizedCoordinates);
    const w2 = this.target.clone().multiplyScalar(2);
    const q = this.element.rotation.value;
    const s = this.point.value;
    const p2 = this.element.position.value.multiplyScalar(2);
    const As2 = s.clone().applyQuaternion(q).multiplyScalar(2);
    const dfdp = p2.clone().add(As2).sub(w2);
    gradient[idx + X] = dfdp.x;
    gradient[idx + Y] = dfdp.y;
    gradient[idx + Z] = dfdp.z;

    const qDiffs = getPartialDiffOfRotationMatrix(
      this.element.rotation.value,
      s
    );
    const pw = new Matrix([[p2.x - w2.x, p2.y - w2.y, p2.z - w2.z]]);
    const dfdq = pw.mmul(qDiffs); // (1,4)になるので注意
    gradient[idx + Q0] = dfdq.get(0, 0);
    gradient[idx + Q1] = dfdq.get(0, 1);
    gradient[idx + Q2] = dfdq.get(0, 2);
    gradient[idx + Q3] = dfdq.get(0, 3);

    return gradient;
  }
}
