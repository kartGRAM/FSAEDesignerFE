/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {Matrix} from 'ml-matrix';
import {IElement} from '@gd/IElements';
import {Vector3, Quaternion} from 'three';
import {
  getStableOrthogonalVector,
  setSubMatrix,
  getPartialDiffOfRotationMatrix,
  skew,
  rotationMatrix,
  decompositionMatrixG
} from './KinematicFunctions';

export interface Constrain {
  constrains: number;
  setJacobianAndConstrains(phi_q: Matrix, phi: number[]): void;
}

const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;
const Q1 = 4;
const Q2 = 5;
const Q3 = 6;

export class Hinge implements Constrain {
  constrains = 5; // 自由度を5減らす

  row: number;

  lhs: Component;

  rhs: Component;

  lLocalVec: Vector3;

  lLocalSkew: Matrix;

  // 軸に垂直なベクトル
  lOrthogonalVec: [Vector3, Vector3];

  lOrthogonalSkew: [Matrix, Matrix];

  rLocalVec: Vector3;

  rLocalSkew: Matrix;

  rAxisVec: Vector3;

  rAxisSkew: Matrix;

  constructor(
    row: number,
    lhs: Component,
    rhs: Component,
    ilhs: [number, number],
    irhs: [number, number]
  ) {
    this.row = row;
    this.lhs = lhs;
    this.rhs = rhs;
    this.lLocalVec = lhs.localVectors[ilhs[0]].clone();
    this.lLocalSkew = skew(this.lLocalVec).mul(2);
    this.rLocalVec = rhs.localVectors[irhs[0]].clone();
    this.rLocalSkew = skew(this.rLocalVec).mul(-2);
    this.rAxisVec = rhs.localVectors[irhs[1]].clone().sub(this.rLocalVec);
    this.rAxisSkew = skew(this.rAxisVec).mul(2);
    const lAxisVec = lhs.localVectors[ilhs[1]].clone().sub(this.lLocalVec);
    if (
      this.rAxisVec.lengthSq() < Number.EPSILON ||
      lAxisVec.lengthSq() < Number.EPSILON
    ) {
      throw new Error('ヒンジを構成する2点が近すぎます');
    }
    const oVec1 = getStableOrthogonalVector(lAxisVec);
    const oVec2 = lAxisVec.cross(oVec1);
    this.lOrthogonalVec = [oVec1, oVec2];
    this.lOrthogonalSkew = [
      skew(this.lOrthogonalVec[0]).mul(2),
      skew(this.lOrthogonalVec[1]).mul(2)
    ];
  }

  setJacobianAndConstrains(phi_q: Matrix, phi: number[]) {
    const cLhs = this.lhs.col;
    const cRhs = this.rhs.col;
    const {
      row,
      lhs,
      rhs,
      lLocalVec,
      lLocalSkew,
      lOrthogonalVec,
      lOrthogonalSkew,
      rLocalVec,
      rLocalSkew,
      rAxisVec,
      rAxisSkew
    } = this;
    const qLhs = lhs.quaternion;
    const qRhs = rhs.quaternion;
    const ALhs = rotationMatrix(qLhs);
    const ARhs = rotationMatrix(qRhs);
    const GLhs = decompositionMatrixG(qLhs);
    const GRhs = decompositionMatrixG(qRhs);
    const sLhs = lLocalVec.clone().applyQuaternion(qLhs);
    const sRhs = rLocalVec.clone().applyQuaternion(qRhs);

    // 始点位置拘束
    {
      const constrain = lhs.position
        .clone()
        .add(sLhs)
        .sub(rhs.position)
        .sub(sRhs);
      phi[row + X] = constrain.x;
      phi[row + Y] = constrain.y;
      phi[row + Z] = constrain.z;
      // diff of positions are 1
      phi_q.set(row + X, cLhs + X, 1);
      phi_q.set(row + Y, cLhs + Y, 1);
      phi_q.set(row + Z, cLhs + Z, 1);
      phi_q.set(row + X, cRhs + X, -1);
      phi_q.set(row + Y, cRhs + Y, -1);
      phi_q.set(row + Z, cRhs + Z, -1);
      setSubMatrix(row + X, cLhs + Q0, phi_q, ALhs.mmul(lLocalSkew).mmul(GLhs));
      setSubMatrix(row + X, cRhs + Q0, phi_q, ARhs.mmul(rLocalSkew).mmul(GRhs));
    }

    // 並行拘束
    const axis = rAxisVec.clone().applyQuaternion(qRhs);
    const axisT = new Matrix([[axis.x, axis.y, axis.z]]); // (1x3)
    const axisDelta = ARhs.mmul(rAxisSkew).mmul(GRhs); // (3x4)
    for (let r = 0; r < 2; ++r) {
      const orthoVec = lOrthogonalVec[r].clone().applyQuaternion(qLhs);
      phi[r + row + 3] = orthoVec.dot(axis);
      const orthoDelta = ALhs.mmul(lOrthogonalSkew[r]).mmul(GLhs); // (3x4)
      const orthoT = new Matrix([[orthoVec.x, orthoVec.y, orthoVec.z]]); // (1x3)
      const dLhs = axisT.mmul(orthoDelta); // (1x3) x (3x4) = (1x4)
      const dRhs = orthoT.mmul(axisDelta); // (1x3) x (3x4) = (1x4)

      setSubMatrix(row + 3 + r, cLhs + Q0, phi_q, dLhs);
      setSubMatrix(row + 3 + r, cRhs + Q0, phi_q, dRhs);
    }
  }
}

// elementの初期状態を取得し、計算後に反映する。
// ただし、Bar, Tire, SpringDumperなど自由度の小さいElementは含まれない
export class Component {
  // ヤコビアンの列番号
  col: number;

  element: IElement;

  position: Vector3;

  quaternion: Quaternion;

  localVectors: Vector3[];

  constructor(element: IElement, col: number) {
    this.col = col;
    this.element = element;
    this.position = element.position.value;
    this.quaternion = element.rotation.value;
    this.localVectors = element.getPoints().map((p) => p.value);
  }
}
