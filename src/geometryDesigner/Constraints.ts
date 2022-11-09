/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {
  getStableOrthogonalVector,
  skew,
  rotationMatrix,
  decompositionMatrixG
} from './KinematicFunctions';
import {IComponent} from './KinematicComponents';

const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;
const Q1 = 4;
const Q2 = 5;
const Q3 = 6;

export interface Constraint {
  readonly lhs: IComponent;
  readonly rhs: IComponent;
  readonly isInequalityConstraint: boolean;
  row: number;
  active(onAssemble: boolean): boolean;
  constraints(onAssemble: boolean): number;
  readonly name: string;
  setJacobianAndConstraints(
    phi_q: Matrix,
    phi: number[],
    onAssemble: boolean
  ): void;

  setJacobianAndConstraintsInequal(
    phi_q: Matrix,
    phi: number[],
    hint: any
  ): any;
  checkInequalityConstraint(): [boolean, any];
}

export class Sphere implements Constraint {
  // 自由度を3減らす
  constraints() {
    return 3;
  }

  active() {
    return true;
  }

  readonly isInequalityConstraint = false;

  row: number = -1;

  lhs: IComponent;

  rhs: IComponent;

  lLocalVec: Vector3;

  lLocalSkew: Matrix;

  rLocalVec: Vector3;

  rLocalSkew: Matrix;

  target: Vector3 = new Vector3();

  name: string;

  isFixed: boolean = false;

  constructor(
    name: string,
    clhs: IComponent,
    crhs: IComponent,
    ilhs: number,
    irhs: number
  ) {
    this.name = name;
    if (clhs.isFixed) {
      if (crhs.isFixed) throw new Error('拘束式の両端が固定されている');
      // 固定側はrhsにする
      this.lhs = crhs;
      this.rhs = clhs;
      const tmp = ilhs;
      ilhs = irhs;
      irhs = tmp;
    } else {
      this.lhs = clhs;
      this.rhs = crhs;
    }

    this.lLocalVec = this.lhs.localVectors[ilhs].clone();
    this.lLocalSkew = skew(this.lLocalVec).mul(2);
    this.rLocalVec = this.rhs.localVectors[irhs].clone();
    this.rLocalSkew = skew(this.rLocalVec).mul(-2);
    if (this.rhs.isFixed) {
      this.isFixed = true;
      this.target = this.rhs.position
        .clone()
        .add(this.rLocalVec.applyQuaternion(this.rhs.quaternion));
    }
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const cLhs = this.lhs.col;
    const {row, lhs, lLocalVec, lLocalSkew} = this;
    const qLhs = lhs.quaternion;
    const ALhs = rotationMatrix(qLhs);
    const GLhs = decompositionMatrixG(qLhs);
    const sLhs = lLocalVec.clone().applyQuaternion(qLhs);

    // 始点位置拘束
    if (!this.isFixed) {
      const {rhs, rLocalVec, rLocalSkew} = this;
      const cRhs = this.rhs.col;
      const qRhs = rhs.quaternion;
      const ARhs = rotationMatrix(qRhs);
      const GRhs = decompositionMatrixG(qRhs);
      const sRhs = rLocalVec.clone().applyQuaternion(qRhs);
      const constraint = lhs.position
        .clone()
        .add(sLhs)
        .sub(rhs.position)
        .sub(sRhs);
      phi[row + X] = constraint.x;
      phi[row + Y] = constraint.y;
      phi[row + Z] = constraint.z;
      // diff of positions are 1
      phi_q.set(row + X, cLhs + X, 1);
      phi_q.set(row + Y, cLhs + Y, 1);
      phi_q.set(row + Z, cLhs + Z, 1);
      phi_q.set(row + X, cRhs + X, -1);
      phi_q.set(row + Y, cRhs + Y, -1);
      phi_q.set(row + Z, cRhs + Z, -1);
      phi_q.setSubMatrix(ALhs.mmul(lLocalSkew).mmul(GLhs), row + X, cLhs + Q0);
      phi_q.setSubMatrix(ARhs.mmul(rLocalSkew).mmul(GRhs), row + X, cRhs + Q0);
    } else {
      const constraint = lhs.position.clone().add(sLhs).sub(this.target);
      phi[row + X] = constraint.x;
      phi[row + Y] = constraint.y;
      phi[row + Z] = constraint.z;
      // diff of positions are 1
      phi_q.set(row + X, cLhs + X, 1);
      phi_q.set(row + Y, cLhs + Y, 1);
      phi_q.set(row + Z, cLhs + Z, 1);
      phi_q.setSubMatrix(ALhs.mmul(lLocalSkew).mmul(GLhs), row + X, cLhs + Q0);
    }
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}

export class Hinge implements Constraint {
  // 自由度を5減らす
  constraints() {
    return 5;
  }

  active() {
    return true;
  }

  readonly isInequalityConstraint = false;

  row: number = -1;

  lhs: IComponent;

  rhs: IComponent;

  lLocalVec: Vector3;

  lLocalSkew: Matrix;

  // 軸に垂直なベクトル
  lOrthogonalVec: [Vector3, Vector3];

  lOrthogonalSkew: [Matrix, Matrix];

  rLocalVec: Vector3;

  rLocalSkew: Matrix;

  rAxisVec: Vector3;

  rAxisSkew: Matrix;

  target: Vector3 = new Vector3();

  name: string;

  isFixed: boolean = false;

  constructor(
    name: string,
    clhs: IComponent,
    crhs: IComponent,
    ilhs: [number, number],
    irhs: [number, number]
  ) {
    this.name = name;
    if (crhs.isFixed) {
      if (clhs.isFixed) throw new Error('拘束式の両端が固定されている');
      // 固定側はlhsにする
      this.lhs = crhs;
      this.rhs = clhs;
      const tmp = ilhs;
      ilhs = irhs;
      irhs = tmp;
    } else {
      this.lhs = clhs;
      this.rhs = crhs;
    }
    this.lLocalVec = this.lhs.localVectors[ilhs[0]].clone();
    this.lLocalSkew = skew(this.lLocalVec).mul(2);
    this.rLocalVec = this.rhs.localVectors[irhs[0]].clone();
    this.rLocalSkew = skew(this.rLocalVec).mul(-2);
    this.rAxisVec = this.rhs.localVectors[irhs[1]].clone().sub(this.rLocalVec);
    this.rAxisSkew = skew(this.rAxisVec).mul(2);
    const lAxisVec = this.lhs.localVectors[ilhs[1]].clone().sub(this.lLocalVec);
    if (
      this.rAxisVec.lengthSq() < Number.EPSILON ||
      lAxisVec.lengthSq() < Number.EPSILON
    ) {
      throw new Error('ヒンジを構成する2点が近すぎます');
    }
    const oVec1 = getStableOrthogonalVector(lAxisVec);
    const oVec2 = lAxisVec.cross(oVec1);
    if (this.lhs.isFixed) {
      this.isFixed = true;
      this.target = this.lhs.position
        .clone()
        .add(this.lLocalVec.applyQuaternion(this.lhs.quaternion));
      oVec1.applyQuaternion(this.lhs.quaternion);
      oVec2.applyQuaternion(this.lhs.quaternion);
    }
    this.lOrthogonalVec = [oVec1, oVec2];
    this.lOrthogonalSkew = [
      skew(this.lOrthogonalVec[0]).mul(2),
      skew(this.lOrthogonalVec[1]).mul(2)
    ];
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const cRhs = this.rhs.col;
    const cLhs = this.lhs.col;
    const {
      row,
      rhs,
      rLocalVec,
      rLocalSkew,
      rAxisVec,
      rAxisSkew,
      lhs,
      lLocalVec,
      lLocalSkew
    } = this;
    const qRhs = rhs.quaternion;
    const ARhs = rotationMatrix(qRhs);
    const GRhs = decompositionMatrixG(qRhs);
    const sRhs = rLocalVec.clone().applyQuaternion(qRhs);
    const qLhs = lhs.quaternion;
    const ALhs = rotationMatrix(qLhs);
    const GLhs = decompositionMatrixG(qLhs);

    // 始点位置拘束
    if (!this.isFixed) {
      const sLhs = lLocalVec.clone().applyQuaternion(qLhs);
      const constraint = lhs.position
        .clone()
        .add(sLhs)
        .sub(rhs.position)
        .sub(sRhs);
      phi[row + X] = constraint.x;
      phi[row + Y] = constraint.y;
      phi[row + Z] = constraint.z;
      // diff of positions are 1
      phi_q.set(row + X, cLhs + X, 1);
      phi_q.set(row + Y, cLhs + Y, 1);
      phi_q.set(row + Z, cLhs + Z, 1);
      phi_q.set(row + X, cRhs + X, -1);
      phi_q.set(row + Y, cRhs + Y, -1);
      phi_q.set(row + Z, cRhs + Z, -1);
      phi_q.setSubMatrix(ALhs.mmul(lLocalSkew).mmul(GLhs), row + X, cLhs + Q0);
      phi_q.setSubMatrix(ARhs.mmul(rLocalSkew).mmul(GRhs), row + X, cRhs + Q0);
    } else {
      const constraint = this.target.clone().sub(rhs.position).sub(sRhs);
      phi[row + X] = constraint.x;
      phi[row + Y] = constraint.y;
      phi[row + Z] = constraint.z;
      // diff of positions are 1
      phi_q.set(row + X, cRhs + X, -1);
      phi_q.set(row + Y, cRhs + Y, -1);
      phi_q.set(row + Z, cRhs + Z, -1);
      phi_q.setSubMatrix(ARhs.mmul(rLocalSkew).mmul(GRhs), row + X, cRhs + Q0);
    }

    // 並行拘束
    const axis = rAxisVec.clone().applyQuaternion(qRhs);
    const axisT = new Matrix([[axis.x, axis.y, axis.z]]); // (1x3)
    const axisDelta = ARhs.mmul(rAxisSkew).mmul(GRhs); // (3x4)
    for (let r = 0; r < 2; ++r) {
      let orthoVec = this.lOrthogonalVec[r];
      if (!this.isFixed) {
        orthoVec = orthoVec.clone().applyQuaternion(qLhs);
        const orthoDelta = ALhs.mmul(this.lOrthogonalSkew[r]).mmul(GLhs); // (3x4)
        const dLhs = axisT.mmul(orthoDelta); // (1x3) x (3x4) = (1x4)
        phi_q.setSubMatrix(dLhs, row + 3 + r, cLhs + Q0);
      }
      const orthoT = new Matrix([[orthoVec.x, orthoVec.y, orthoVec.z]]); // (1x3)
      phi[r + row + 3] = orthoVec.dot(axis);
      const dRhs = orthoT.mmul(axisDelta); // (1x3) x (3x4) = (1x4)
      phi_q.setSubMatrix(dRhs, row + 3 + r, cRhs + Q0);
    }
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}

export class BarAndSpheres implements Constraint {
  // 自由度を1減らす
  constraints(onAssemble: boolean) {
    if (!onAssemble && this.isSpringDumper) return 0;
    return 1;
  }

  active(onAssemble: boolean) {
    if (!onAssemble && this.isSpringDumper) return false;
    return true;
  }

  get isInequalityConstraint() {
    return this.isSpringDumper;
  }

  row: number = -1;

  lhs: IComponent;

  rhs: IComponent;

  lLocalVec: Vector3;

  lLocalSkew: Matrix;

  rLocalVec: Vector3;

  rLocalSkew: Matrix;

  l2: number;

  name: string;

  target: Vector3 = new Vector3();

  isFixed: boolean = false;

  isSpringDumper: boolean;

  dlMin: number = Number.MIN_SAFE_INTEGER;

  dlMax: number = Number.MAX_SAFE_INTEGER;

  constructor(
    name: string,
    clhs: IComponent,
    crhs: IComponent,
    ilhs: number,
    irhs: number,
    l: number,
    isSpringDumper: boolean,
    dlMin?: number,
    dlMax?: number
  ) {
    this.name = name;
    this.isSpringDumper = isSpringDumper;
    if (dlMin) this.dlMin = dlMin;
    if (dlMax) this.dlMax = dlMax;
    if (clhs.isFixed) {
      if (crhs.isFixed) throw new Error('拘束式の両端が固定されている');
      // 固定側はrhsにする
      this.lhs = crhs;
      this.rhs = clhs;
      const tmp = ilhs;
      ilhs = irhs;
      irhs = tmp;
    } else {
      this.lhs = clhs;
      this.rhs = crhs;
    }
    this.lLocalVec = this.lhs.localVectors[ilhs].clone();
    this.lLocalSkew = skew(this.lLocalVec).mul(2);
    this.rLocalVec = this.rhs.localVectors[irhs].clone();
    this.rLocalSkew = skew(this.rLocalVec).mul(-2);
    if (this.rhs.isFixed) {
      this.isFixed = true;
      this.target = this.rhs.position
        .clone()
        .add(this.rLocalVec.applyQuaternion(this.rhs.quaternion));
    }
    this.l2 = l * l;
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[], onAssemble: boolean) {
    if (!onAssemble && this.isSpringDumper) return;
    this.setJacobianAndConstraintsImpl(this.l2, phi_q, phi);
  }

  setJacobianAndConstraintsInequal(
    phi_q: Matrix,
    phi: number[],
    hint: any
  ): number {
    const l = Math.sqrt(this.l2);
    let l2 = (l + this.dlMax) ** 2;
    let hintN = hint as number;
    if (!hint) {
      // eslint-disable-next-line prefer-destructuring
      hintN = this.checkInequalityConstraint()[1];
    }
    if (hintN === -1) l2 = (l + this.dlMin) ** 2;
    this.setJacobianAndConstraintsImpl(l2, phi_q, phi);
    return hintN;
  }

  checkInequalityConstraint(): [boolean, number] {
    let d: number = 0;
    const {lhs, lLocalVec} = this;
    const qLhs = lhs.quaternion;
    const sLhs = lLocalVec.clone().applyQuaternion(qLhs);
    if (!this.isFixed) {
      const {rhs, rLocalVec} = this;
      const qRhs = rhs.quaternion;
      const sRhs = rLocalVec.clone().applyQuaternion(qRhs);
      d = lhs.position.clone().add(sLhs).sub(rhs.position).sub(sRhs).length();
    } else {
      d = lhs.position.clone().add(sLhs).sub(this.target).length();
    }
    const l = Math.sqrt(this.l2);
    const lMin = l + this.dlMin - Number.EPSILON;
    const lMax = l + this.dlMax + Number.EPSILON;
    let hint = 0;
    if (d < lMin) hint = -1;
    if (d > lMax) hint = 1;
    return [d < lMin || lMax < d, hint];
  }

  setJacobianAndConstraintsImpl(l2: number, phi_q: Matrix, phi: number[]) {
    const cLhs = this.lhs.col;
    const {row, lhs, lLocalVec, lLocalSkew} = this;
    const qLhs = lhs.quaternion;
    const ALhs = rotationMatrix(qLhs);
    const GLhs = decompositionMatrixG(qLhs);
    const sLhs = lLocalVec.clone().applyQuaternion(qLhs);
    if (!this.isFixed) {
      const {rhs, rLocalVec, rLocalSkew} = this;
      const cRhs = this.rhs.col;
      const qRhs = rhs.quaternion;
      const ARhs = rotationMatrix(qRhs);
      const GRhs = decompositionMatrixG(qRhs);
      const sRhs = rLocalVec.clone().applyQuaternion(qRhs);
      const d = lhs.position.clone().add(sLhs).sub(rhs.position).sub(sRhs);
      const dT = new Matrix([[d.x * 2, d.y * 2, d.z * 2]]); // (1x3)
      phi[row] = d.lengthSq() - l2;

      phi_q.setSubMatrix(dT, row, cLhs + X);
      phi_q.setSubMatrix(dT.clone().mul(-1), row, cRhs + X);
      phi_q.setSubMatrix(
        dT.mmul(ALhs).mmul(lLocalSkew).mmul(GLhs),
        row,
        cLhs + Q0
      );
      phi_q.setSubMatrix(
        dT.mmul(ARhs).mmul(rLocalSkew).mmul(GRhs),
        row,
        cRhs + Q0
      );
    } else {
      const d = lhs.position.clone().add(sLhs).sub(this.target);
      const dT = new Matrix([[d.x * 2, d.y * 2, d.z * 2]]); // (1x3)
      phi[row] = d.lengthSq() - l2;

      phi_q.setSubMatrix(dT, row, cLhs + X);
      phi_q.setSubMatrix(
        dT.mmul(ALhs).mmul(lLocalSkew).mmul(GLhs), // (1x3) x (3x3) x(3x3) x (3x4) = (1x4)
        row,
        cLhs + Q0
      );
    }
  }
}

export class LinearBushingSingleEnd implements Constraint {
  // 自由度を2減らす
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constraints(onAssemble: boolean) {
    // 組み立て時は固定する
    // if (onAssemble) return 3;
    return 2;
  }

  active() {
    return true;
  }

  readonly isInequalityConstraint = false;

  get lhs() {
    return this.res;
  }

  get rhs() {
    return this.fixed;
  }

  row: number = -1;

  res: IComponent;

  fixed: IComponent;

  resLocalVec: Vector3;

  resLocalSkew: Matrix;

  fixedLocalVec: [Vector3, Vector3];

  fixedLocalSkew: [Matrix, Matrix];

  // 軸に垂直なベクトル
  fixedOrthogonalVec: [Vector3, Vector3];

  fixedOrthogonalSkew: [Matrix, Matrix];

  name: string;

  isFixed: boolean = false;

  dlMin: number = Number.MIN_SAFE_INTEGER;

  dlMax: number = Number.MAX_SAFE_INTEGER;

  constructor(
    name: string,
    cRodEndSide: IComponent,
    cFixed: IComponent,
    iRodEndSide: number,
    iFixed: [number, number],
    dlMin?: number,
    dlMax?: number
  ) {
    this.name = name;
    if (dlMin) this.dlMin = dlMin;
    if (dlMax) this.dlMax = dlMax;
    if (cRodEndSide.isFixed) {
      throw new Error('RodEnd側が固定されている');
    }
    this.res = cRodEndSide;
    this.fixed = cFixed;

    this.resLocalVec = this.res.localVectors[iRodEndSide].clone();
    this.resLocalSkew = skew(this.resLocalVec).mul(2);
    this.fixedLocalVec = [
      this.fixed.localVectors[iFixed[0]].clone(),
      this.fixed.localVectors[iFixed[1]].clone()
    ];
    const fixedAxisVec = this.fixed.localVectors[iFixed[1]]
      .clone()
      .sub(this.fixed.localVectors[iFixed[0]]);

    if (fixedAxisVec.lengthSq() < Number.EPSILON) {
      throw new Error('リニアブッシュを保持するする2点が近すぎます');
    }
    this.fixedLocalSkew = [
      skew(this.fixedLocalVec[0]).mul(2),
      skew(this.fixedLocalVec[1]).mul(2)
    ];

    if (this.fixed.isFixed) {
      this.isFixed = true;
      this.fixedLocalVec[0]
        .applyQuaternion(this.fixed.quaternion)
        .add(this.fixed.position);
      this.fixedLocalVec[1]
        .applyQuaternion(this.fixed.quaternion)
        .add(this.fixed.position);
    }
    const oVec1 = getStableOrthogonalVector(fixedAxisVec);
    const oVec2 = fixedAxisVec.cross(oVec1);
    this.fixedOrthogonalVec = [oVec1, oVec2];
    this.fixedOrthogonalSkew = [
      skew(this.fixedOrthogonalVec[0]).mul(2),
      skew(this.fixedOrthogonalVec[1]).mul(2)
    ];
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const cRes = this.res.col;
    const cFixed = this.fixed.col;
    const {
      row,
      fixed,
      fixedLocalVec,
      fixedLocalSkew,
      res,
      resLocalVec,
      resLocalSkew
    } = this;
    const pFixed = fixed.position;
    const qFixed = fixed.quaternion;
    const AFixed = rotationMatrix(qFixed);
    const GFixed = decompositionMatrixG(qFixed);
    const sFixed = fixedLocalVec.map((v) => v.clone().applyQuaternion(qFixed));

    const pRes = res.position.clone();
    const qRes = res.quaternion;
    const ARes = rotationMatrix(qRes);
    const GRes = decompositionMatrixG(qRes);

    // 並行拘束
    const axis = resLocalVec.clone().applyQuaternion(qRes).add(pRes);
    if (!this.isFixed) {
      axis.sub(sFixed[0].clone().add(pFixed));
    } else {
      axis.sub(sFixed[0]);
    }
    const axisT = Matrix.rowVector([axis.x, axis.y, axis.z]); // (1x3)
    const axisDeltaQ = ARes.mmul(resLocalSkew).mmul(GRes); // (3x4)
    const dFixedDeltaQ = AFixed.mmul(fixedLocalSkew[0]).mmul(GFixed);
    for (let r = 0; r < 2; ++r) {
      let orthoVec = this.fixedOrthogonalVec[r];
      const orthoVecT = Matrix.rowVector([orthoVec.x, orthoVec.y, orthoVec.z]); // (1x3)
      if (!this.isFixed) {
        orthoVec = orthoVec.clone().applyQuaternion(qFixed);
        const orthoDelta = AFixed.mmul(this.fixedOrthogonalSkew[r]).mmul(
          GFixed
        ); // (3x4)
        const dFixed = axisT.mmul(orthoDelta); // (1x3) x (3x4) = (1x4)
        dFixed.sub(orthoVecT.mmul(dFixedDeltaQ)); // (1x3) x (3x4) = (1x4)
        phi_q.setSubMatrix(orthoVecT.clone().mul(-1), row + r, cFixed + X);
        phi_q.setSubMatrix(dFixed, row + r, cFixed + Q0);
      }
      phi[r + row] = orthoVec.dot(axis);
      const dRes = orthoVecT.mmul(axisDeltaQ); // (1x3) x (3x4) = (1x4)
      phi_q.setSubMatrix(orthoVecT, row + r, cRes + X);
      phi_q.setSubMatrix(dRes, row + 3 + r, cRes + Q0);
    }
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}

export class QuaternionConstraint implements Constraint {
  // 自由度を1減らす
  constraints() {
    return 1;
  }

  active() {
    return true;
  }

  readonly isInequalityConstraint = false;

  row: number = -1;

  IComponent: IComponent;

  get lhs() {
    return this.IComponent;
  }

  get rhs() {
    return this.IComponent;
  }

  name: string;

  constructor(name: string, IComponent: IComponent) {
    this.name = name;
    this.IComponent = IComponent;
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row, IComponent} = this;
    const {col} = IComponent;
    const q = IComponent.quaternion;

    const e0 = q.w;
    const e1 = q.x;
    const e2 = q.y;
    const e3 = q.z;
    phi[row] = e0 * e0 + e1 * e1 + e2 * e2 + e3 * e3 - 1;

    phi_q.set(row, col + Q0, 2 * e0);
    phi_q.set(row, col + Q1, 2 * e1);
    phi_q.set(row, col + Q2, 2 * e2);
    phi_q.set(row, col + Q3, 2 * e3);
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}
