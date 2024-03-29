/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */

import {Matrix} from 'ml-matrix';
import {isElement} from '@gd/IElements';
import {INamedVector3RO} from '@gd/INamedValues';
import {Vector3} from 'three';
import {IComponent} from '@gd/kinematics/KinematicComponents';
import {ISolver} from '@gd/kinematics/ISolver';
import {getPartialDiffOfRotationMatrix} from '@gd/kinematics/KinematicFunctions';

export interface IObjectiveFunction {
  component: IComponent;
  getGradient(dFx: number[]): void;
}
const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;
const Q1 = 4;
const Q2 = 5;
const Q3 = 6;

export class MovePointTo implements IObjectiveFunction {
  point: INamedVector3RO;

  target: Vector3;

  component: IComponent;

  constructor(point: INamedVector3RO, target: Vector3, solver: ISolver) {
    this.point = point;
    this.target = target;
    if (!isElement(point.parent)) throw new Error('pointの親がElementじゃない');
    if (!(point.parent.nodeID in solver.componentsFromNodeID))
      throw new Error('SolverにElementが含まれていない');
    const element = point.parent;
    this.component = solver.componentsFromNodeID[element.nodeID];
  }

  getGradient(dFx: number[]) {
    /*
    枠Oでの点wまでの距離を最小化する
    f = {(p + As - w)T}・(p + As - w);
         = p^2 + s^2 + w^2 + 2p・As - 2p・w - 2w・As

    δf = (2p +2As -2w)Tδp + (2p-2w)・δAs
       = (2p + 2As - 2w)Tδp + (2p - 2w)T・(As~・G)δq
    */
    const w2 = this.target.clone().multiplyScalar(2 * this.component.scale);
    const q = this.component.quaternion;
    const s = this.point.value.multiplyScalar(this.component.scale);
    const p2 = this.component.position.clone().multiplyScalar(2);
    const As2 = s.clone().applyQuaternion(q).multiplyScalar(2);
    const dfdp = p2.clone().add(As2).sub(w2);
    const idx = this.component.col;
    dFx[idx + X] = dfdp.x;
    dFx[idx + Y] = dfdp.y;
    dFx[idx + Z] = dfdp.z;

    const p2subw2 = p2.sub(w2);
    const qDiffs = getPartialDiffOfRotationMatrix(q, s); // (3x4)
    const pw = new Matrix([[p2subw2.x, p2subw2.y, p2subw2.z]]); // (1x3)
    const dfdq = pw.mmul(qDiffs); // (1x3) x (3x4 ) = (1,4)になるので注意
    dFx[idx + Q0] = dfdq.get(0, 0);
    dFx[idx + Q1] = dfdq.get(0, 1);
    dFx[idx + Q2] = dfdq.get(0, 2);
    dFx[idx + Q3] = dfdq.get(0, 3);
  }
}
