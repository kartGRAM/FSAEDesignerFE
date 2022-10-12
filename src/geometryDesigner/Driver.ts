/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {Matrix} from 'ml-matrix';
import {IAssembly, IElement, isElement} from '@gd/IElements';
import {INamedVector3} from '@gd/INamedValues';
import {Vector3} from 'three';
import {getPartialDiffOfRotationMatrix, setSubMatrix} from '@gd/Kinematics';

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

export class MovePointDelta implements IObjectiveFunction {
  point: INamedVector3;

  element: IElement;

  dv: Vector3;

  constructor(point: INamedVector3, dv: Vector3) {
    this.point = point;
    this.dv = dv;
    if (!isElement(point.parent)) throw new Error('pointの親がElementじゃない');
    this.element = point.parent;
  }

  getGradient(assembly: IAssembly): number[] {
    /*
    枠Oでの点qまでの距離を最小化する
    f(x) = {(P + As - q)T}・(P + As - q);
         = P^2 + s^2 +
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
    gradient[1);
    matrix.set(1, idx + 1, 1);
    matrix.set(2, idx + 2, 1);

    const qDiffs = getPartialDiffOfRotationMatrix(
      this.element.rotation.value,
      this.point.value
    );

    setSubMatrix(X, Z, idx + Q0, idx + Q3, matrix, qDiffs);

    return matrix;
  }
}
