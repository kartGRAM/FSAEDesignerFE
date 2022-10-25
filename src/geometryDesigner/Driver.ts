/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {Matrix} from 'ml-matrix';
import {IElement, isElement} from '@gd/IElements';
import {INamedVector3} from '@gd/INamedValues';
import {Vector3} from 'three';
import {KinematicSolver, Component} from '@gd/KinematicComponents';
import {
  getIndexOfPoint,
  getPartialDiffOfRotationMatrix
} from '@gd/KinematicFunctions';

export interface IObjectiveFunction {
  component: Component;
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
  point: INamedVector3;

  element: IElement;

  target: Vector3;

  component: Component;

  pointIdx: number;

  constructor(point: INamedVector3, target: Vector3, solver: KinematicSolver) {
    this.point = point;
    this.target = target;
    if (!isElement(point.parent)) throw new Error('pointの親がElementじゃない');
    if (!(point.parent.nodeID in solver.componentsFromNodeID))
      throw new Error('SolverにElementが含まれていない');
    this.element = point.parent;
    this.pointIdx = getIndexOfPoint(this.element, point);
    this.component = solver.componentsFromNodeID[this.element.nodeID];
  }

  getGradient(dFx: number[]) {
    /*
    枠Oでの点wまでの距離を最小化する
    f = {(p + As - w)T}・(p + As - w);
         = p^2 + s^2 + w^2 + 2p・As - 2p・w - 2w・As

    δf = (2p +2As -2w)Tδp + (2p-2w)・δAs
       = (2p + 2As - 2w)Tδp + (2p-2w)T・(As~・G)δq
    */
    const w2 = this.target.clone().multiplyScalar(2);
    const q = this.element.rotation.value;
    const s = this.point.value;
    const p2 = this.element.position.value.multiplyScalar(2);
    const As2 = s.clone().applyQuaternion(q).multiplyScalar(2);
    const dfdp = p2.clone().add(As2).sub(w2);
    const idx = this.component.col;
    dFx[idx + X] = dfdp.x;
    dFx[idx + Y] = dfdp.y;
    dFx[idx + Z] = dfdp.z;

    const qDiffs = getPartialDiffOfRotationMatrix(
      this.element.rotation.value,
      s
    ); // (3x4)
    const pw = new Matrix([[p2.x - w2.x, p2.y - w2.y, p2.z - w2.z]]); // (1x3)
    const dfdq = pw.mmul(qDiffs); // (1x3) x (3x4 ) = (1,4)になるので注意
    dFx[idx + Q0] = dfdq.get(0, 0);
    dFx[idx + Q1] = dfdq.get(0, 1);
    dFx[idx + Q2] = dfdq.get(0, 2);
    dFx[idx + Q3] = dfdq.get(0, 3);
  }
}
