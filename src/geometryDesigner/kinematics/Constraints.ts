/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {isObject} from '@utils/helpers';
import {
  getStableOrthogonalVector,
  skew,
  rotationMatrix,
  decompositionMatrixG
} from './KinematicFunctions';
import {
  IVariable,
  IComponent,
  FullDegreesComponent,
  isFullDegreesComponent
} from './KinematicComponents';

const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;
const Q1 = 4;
const Q2 = 5;
const Q3 = 6;

export interface ConstraintsOptions {
  onAssemble?: boolean;
  fixSpringDumpersAtCurrentPositions?: boolean;
}

interface deltaL {
  hasDl: true;
  dl: number;
  readonly controledBy: string[];
  readonly controled: boolean;
}

export function hasDl(object: any): object is deltaL {
  return isObject(object) && object.hasDl;
}

export function controled(object: any): object is deltaL {
  return isObject(object) && object.hasDl && object.controled;
}

export interface Constraint {
  readonly className: string;
  readonly relevantVariables: IVariable[];
  readonly isInequalityConstraint: boolean;
  row: number;
  active(options: ConstraintsOptions): boolean;
  constraints(options: ConstraintsOptions): number;
  readonly name: string;
  setJacobianAndConstraints(
    phi_q: Matrix,
    phi: number[],
    options: ConstraintsOptions
  ): void;

  setJacobianAndConstraintsInequal(
    phi_q: Matrix,
    phi: number[],
    hint: any
  ): any;
  checkInequalityConstraint(): [boolean, any];
  resetStates(): void;
}

export class Sphere implements Constraint {
  readonly className = 'Sphere';

  // 自由度を3減らす
  constraints() {
    return 3;
  }

  active() {
    return true;
  }

  resetStates(): void {}

  readonly isInequalityConstraint = false;

  row: number = -1;

  relevantVariables: IComponent[];

  lhs: IComponent;

  rhs: IComponent;

  lLocalVec: Vector3;

  lLocalSkew: Matrix;

  rLocalVec: Vector3;

  rLocalSkew: Matrix;

  target: Vector3 = new Vector3();

  name: string;

  isFixed: boolean = false;

  swaped: boolean;

  setVlhs(vlhs: Vector3, checkSwap: boolean = true): void {
    if (this.swaped && checkSwap) {
      this.setVrhs(vlhs, false);
      return;
    }
    this.lLocalVec = vlhs.clone();
    this.lLocalSkew = skew(this.lLocalVec).mul(-2);
  }

  setVrhs(vrhs: Vector3, checkSwap: boolean = true): void {
    if (this.swaped && checkSwap) {
      this.setVlhs(vrhs, false);
      return;
    }
    this.rLocalVec = vrhs.clone();
    this.rLocalSkew = skew(this.rLocalVec).mul(2);
    if (this.rhs.isFixed) {
      this.target = this.rhs.position
        .clone()
        .add(this.rLocalVec.applyQuaternion(this.rhs.quaternion));
    }
  }

  constructor(
    name: string,
    clhs: IComponent,
    crhs: IComponent,
    vlhs?: Vector3,
    vrhs?: Vector3
  ) {
    this.name = name;
    if (clhs.isFixed) {
      if (crhs.isFixed) throw new Error('拘束式の両端が固定されている');
      this.swaped = true;
      // 固定側はrhsにする
      this.lhs = crhs;
      this.rhs = clhs;
      const tmp = vlhs;
      vlhs = vrhs;
      vrhs = tmp;
    } else {
      this.swaped = false;
      this.lhs = clhs;
      this.rhs = crhs;
    }
    this.relevantVariables = [this.lhs, this.rhs];

    this.lLocalVec = vlhs?.clone().multiplyScalar(clhs.scale) ?? new Vector3();
    this.lLocalSkew = skew(this.lLocalVec).mul(-2);
    this.rLocalVec = vrhs?.clone().multiplyScalar(crhs.scale) ?? new Vector3();
    this.rLocalSkew = skew(this.rLocalVec).mul(2);
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
      if (isFullDegreesComponent(lhs)) {
        phi_q.setSubMatrix(
          ALhs.mmul(lLocalSkew).mmul(GLhs),
          row + X,
          cLhs + Q0
        );
      }
      if (isFullDegreesComponent(rhs)) {
        phi_q.setSubMatrix(
          ARhs.mmul(rLocalSkew).mmul(GRhs),
          row + X,
          cRhs + Q0
        );
      }
    } else {
      const constraint = lhs.position.clone().add(sLhs).sub(this.target);
      phi[row + X] = constraint.x;
      phi[row + Y] = constraint.y;
      phi[row + Z] = constraint.z;
      // diff of positions are 1
      phi_q.set(row + X, cLhs + X, 1);
      phi_q.set(row + Y, cLhs + Y, 1);
      phi_q.set(row + Z, cLhs + Z, 1);
      if (isFullDegreesComponent(lhs)) {
        phi_q.setSubMatrix(
          ALhs.mmul(lLocalSkew).mmul(GLhs),
          row + X,
          cLhs + Q0
        );
      }
    }
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}

export class Hinge implements Constraint {
  readonly className = 'Hinge';

  // 自由度を5減らす
  constraints() {
    return 5;
  }

  active() {
    return true;
  }

  resetStates(): void {}

  readonly isInequalityConstraint = false;

  row: number = -1;

  relevantVariables: IComponent[];

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
    clhs: FullDegreesComponent,
    crhs: FullDegreesComponent,
    vlhs: [Vector3, Vector3],
    vrhs: [Vector3, Vector3]
  ) {
    this.name = name;
    if (crhs.isFixed) {
      if (clhs.isFixed) throw new Error('拘束式の両端が固定されている');
      // 固定側はlhsにする
      this.lhs = crhs;
      this.rhs = clhs;
      const tmp = vlhs;
      vlhs = vrhs;
      vrhs = tmp;
    } else {
      this.lhs = clhs;
      this.rhs = crhs;
    }

    this.relevantVariables = [this.lhs, this.rhs];
    this.lLocalVec = vlhs[0].clone().multiplyScalar(clhs.scale);
    this.lLocalSkew = skew(this.lLocalVec).mul(-2);
    this.rLocalVec = vrhs[0].clone().multiplyScalar(crhs.scale);
    this.rLocalSkew = skew(this.rLocalVec).mul(2);
    this.rAxisVec = this.lLocalVec.clone().sub(this.rLocalVec);
    this.rAxisSkew = skew(this.rAxisVec).mul(-2);
    const lAxisVec = this.rLocalVec.clone().sub(this.lLocalVec);
    if (
      this.rAxisVec.lengthSq() < Number.EPSILON ||
      lAxisVec.lengthSq() < Number.EPSILON
    ) {
      throw new Error('ヒンジを構成する2点が近すぎます');
    }
    const oVec1 = getStableOrthogonalVector(lAxisVec);
    const oVec2 = lAxisVec.cross(oVec1).normalize();
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
      skew(this.lOrthogonalVec[0]).mul(-2),
      skew(this.lOrthogonalVec[1]).mul(-2)
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

export class BarAndSpheres implements Constraint, deltaL {
  readonly className: typeof BarAndSpheres.barAndSpheresClassName =
    BarAndSpheres.barAndSpheresClassName;

  static barAndSpheresClassName = 'BarAndSpheres' as const;

  // 自由度を1減らす
  constraints(options: ConstraintsOptions) {
    const {onAssemble, fixSpringDumpersAtCurrentPositions} = options;
    if (onAssemble) return 1;
    if (this.isSpringDumper && fixSpringDumpersAtCurrentPositions) return 1;
    if (this.isSpringDumper) return 0;
    return 1;
  }

  active(options: ConstraintsOptions) {
    const {onAssemble, fixSpringDumpersAtCurrentPositions} = options;
    if (onAssemble) return true;
    if (this.isSpringDumper && fixSpringDumpersAtCurrentPositions) return true;
    if (this.isSpringDumper) return false;
    return true;
  }

  resetStates(): void {
    this._dl = 0;
  }

  get isInequalityConstraint() {
    return this.isSpringDumper;
  }

  row: number = -1;

  relevantVariables: IComponent[];

  lhs: IComponent;

  rhs: IComponent;

  lLocalVec: Vector3;

  lLocalSkew: Matrix;

  rLocalVec: Vector3;

  rLocalSkew: Matrix;

  l2: number;

  hasDl = true as const;

  private _dl: number = 0;

  set dl(value: number) {
    if (this.controled) {
      this._dl = Math.min(
        this.dlMax,
        Math.max(this.dlMin, value * this.lhs.scale)
      );
    }
  }

  get dl(): number {
    if (this.controled) return this._dl;
    return this.getDistanceOfEndPoints() - Math.sqrt(this.l2);
  }

  name: string;

  elementID: string;

  readonly controledBy: string[];

  get controled() {
    return this.controledBy.length > 0;
  }

  target: Vector3 = new Vector3();

  isFixed: boolean = false;

  isSpringDumper: boolean;

  dlMin: number = Number.MIN_SAFE_INTEGER;

  dlMax: number = Number.MAX_SAFE_INTEGER;

  constructor(
    name: string,
    clhs: IComponent,
    crhs: IComponent,
    l: number,
    controledBy: string[],
    vlhs?: Vector3,
    vrhs?: Vector3,
    isSpringDumper?: boolean,
    dlMin?: number,
    dlMax?: number,
    elementID?: string
  ) {
    this.name = name;
    this.controledBy = controledBy;
    this.elementID = elementID ?? '';
    this.isSpringDumper = (!this.controled && isSpringDumper) ?? false;
    if (clhs.isFixed) {
      if (crhs.isFixed) throw new Error('拘束式の両端が固定されている');
      // 固定側はrhsにする
      this.lhs = crhs;
      this.rhs = clhs;
      const tmp = vlhs;
      vlhs = vrhs;
      vrhs = tmp;
    } else {
      this.lhs = clhs;
      this.rhs = crhs;
    }
    this.relevantVariables = [this.lhs, this.rhs];
    if (dlMin) this.dlMin = dlMin * this.lhs.scale;
    if (dlMax) this.dlMax = dlMax * this.lhs.scale;
    this.lLocalVec = vlhs?.clone().multiplyScalar(clhs.scale) ?? new Vector3();
    this.lLocalSkew = skew(this.lLocalVec).mul(-2);
    this.rLocalVec = vrhs?.clone().multiplyScalar(crhs.scale) ?? new Vector3();
    this.rLocalSkew = skew(this.rLocalVec).mul(2);
    if (this.rhs.isFixed) {
      this.isFixed = true;
      this.target = this.rhs.position
        .clone()
        .add(this.rLocalVec.applyQuaternion(this.rhs.quaternion));
    }
    const ls = l * clhs.scale;
    this.l2 = ls * ls;
  }

  setJacobianAndConstraints(
    phi_q: Matrix,
    phi: number[],
    options: ConstraintsOptions
  ) {
    const {onAssemble, fixSpringDumpersAtCurrentPositions} = options;
    if (
      !onAssemble &&
      this.isSpringDumper &&
      !fixSpringDumpersAtCurrentPositions
    )
      return;
    let {l2} = this;
    if (this.isSpringDumper && fixSpringDumpersAtCurrentPositions)
      l2 = this.getDistanceOfEndPoints() ** 2;
    if (this.controled) l2 = (Math.sqrt(l2) + this._dl) ** 2;
    this.setJacobianAndConstraintsImpl(l2, phi_q, phi);
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

  getDistanceOfEndPoints() {
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
    return d;
  }

  checkInequalityConstraint(): [boolean, number] {
    const d = this.getDistanceOfEndPoints();
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

      if (isFullDegreesComponent(lhs)) {
        phi_q.setSubMatrix(
          dT.mmul(ALhs).mmul(lLocalSkew).mmul(GLhs),
          row,
          cLhs + Q0
        );
      }
      if (isFullDegreesComponent(rhs)) {
        phi_q.setSubMatrix(
          dT.mmul(ARhs).mmul(rLocalSkew).mmul(GRhs),
          row,
          cRhs + Q0
        );
      }
    } else {
      const d = lhs.position.clone().add(sLhs).sub(this.target);
      const dT = new Matrix([[d.x * 2, d.y * 2, d.z * 2]]); // (1x3)
      phi[row] = d.lengthSq() - l2;

      phi_q.setSubMatrix(dT, row, cLhs + X);
      if (isFullDegreesComponent(lhs)) {
        phi_q.setSubMatrix(
          dT.mmul(ALhs).mmul(lLocalSkew).mmul(GLhs), // (1x3) x (3x3) x(3x3) x (3x4) = (1x4)
          row,
          cLhs + Q0
        );
      }
    }
  }
}

export function isBarAndSpheres(
  constraint: Constraint
): constraint is BarAndSpheres {
  return constraint.className === BarAndSpheres.barAndSpheresClassName;
}

export class LinearBushingSingleEnd implements Constraint, deltaL {
  readonly className = 'LinearBushingSingleEnd';

  // 自由度を2減らす
  constraints(options: ConstraintsOptions) {
    const {onAssemble} = options;
    // 組み立て時は固定する
    if (onAssemble) return 3;
    if (this.controled) return 3;
    return 2;
  }

  active() {
    return true;
  }

  readonly isInequalityConstraint = false;

  resetStates(): void {
    this._dl = 0;
  }

  readonly controledBy: string[];

  get controled() {
    return this.controledBy.length > 0;
  }

  row: number = -1;

  res: IComponent;

  fixed: IComponent;

  relevantVariables: IComponent[];

  resLocalVec: Vector3;

  resLocalSkew: Matrix;

  fixedLocalVec: [Vector3, Vector3];

  fixedLocalSkew: [Matrix, Matrix];

  initialLength: number;

  hasDl = true as const;

  _dl: number = 0;

  set dl(value: number) {
    this._dl = Math.min(
      this.dlMax,
      Math.max(this.dlMin, value * this.fixed.scale)
    );
  }

  get dl(): number {
    return this._dl / this.fixed.scale;
  }

  elementID: string;

  fixedAxisVec: Vector3;

  center: Vector3;

  // 軸に垂直なベクトル
  fixedOrthogonalVec: [Vector3, Vector3];

  fixedOrthogonalSkew: [Matrix, Matrix];

  name: string;

  isFixed: boolean = false;

  dlMin: number = Number.MIN_SAFE_INTEGER;

  dlMax: number = Number.MAX_SAFE_INTEGER;

  sphere: Sphere;

  constructor(
    name: string,
    cFixed: FullDegreesComponent,
    cRodEndSide: IComponent,
    vFixed: [Vector3, Vector3],
    initialLength: number,
    controledBy: string[],
    vRodEndSide?: Vector3,
    dlMin?: number,
    dlMax?: number,
    elementID?: string
  ) {
    this.controledBy = controledBy;
    this.elementID = elementID ?? '';
    this.initialLength = initialLength * cFixed.scale;
    this.fixed = cFixed;
    this.res = cRodEndSide;

    this.relevantVariables = [cFixed, cRodEndSide];
    this.fixedLocalVec = [
      vFixed[0].clone().multiplyScalar(cFixed.scale),
      vFixed[1].clone().multiplyScalar(cFixed.scale)
    ];
    this.center = this.fixedLocalVec[1]
      .clone()
      .add(this.fixedLocalVec[0])
      .multiplyScalar(0.5);

    const fixedAxisVec = this.fixedLocalVec[1]
      .clone()
      .sub(this.fixedLocalVec[0]);
    this.fixedAxisVec = fixedAxisVec.clone();
    if (fixedAxisVec.lengthSq() < Number.EPSILON) {
      throw new Error('リニアブッシュを保持するする2点が近すぎます');
    }
    const vRE = vRodEndSide?.clone().multiplyScalar(cRodEndSide.scale);

    this.sphere = new Sphere(
      name,
      this.fixed,
      this.res,
      this.center
        .clone()
        .add(
          this.fixedAxisVec
            .clone()
            .normalize()
            .multiplyScalar(this.initialLength)
        ),
      vRE
    );

    this.name = name;
    if (dlMin) this.dlMin = dlMin * cFixed.scale;
    if (dlMax) this.dlMax = dlMax * cFixed.scale;
    if (cRodEndSide.isFixed) {
      throw new Error('RodEnd側が固定されている');
    }

    this.resLocalVec = vRE?.clone() ?? new Vector3();
    this.resLocalSkew = skew(this.resLocalVec).mul(2);

    if (this.fixed.isFixed) {
      this.isFixed = true;
      this.fixedLocalVec[0]
        .applyQuaternion(this.fixed.quaternion)
        .add(this.fixed.position);
      this.fixedLocalVec[1]
        .applyQuaternion(this.fixed.quaternion)
        .add(this.fixed.position);
    }
    this.fixedLocalSkew = [
      skew(this.fixedLocalVec[0]).mul(2),
      skew(this.fixedLocalVec[1]).mul(2)
    ];

    const oVec1 = getStableOrthogonalVector(fixedAxisVec);
    const oVec2 = fixedAxisVec.cross(oVec1).normalize();
    this.fixedOrthogonalVec = [oVec1, oVec2];
    this.fixedOrthogonalSkew = [
      skew(this.fixedOrthogonalVec[0]).mul(2),
      skew(this.fixedOrthogonalVec[1]).mul(2)
    ];
  }

  setJacobianAndConstraints(
    phi_q: Matrix,
    phi: number[],
    options: ConstraintsOptions
  ) {
    const {onAssemble} = options;
    if (this.controled) {
      this.sphere.row = this.row;
      this.sphere.setVlhs(
        this.center.clone().add(
          this.fixedAxisVec
            .clone()
            .normalize()
            .multiplyScalar(this.initialLength + this._dl)
        )
      );
      this.sphere.setJacobianAndConstraints(phi_q, phi);
      return;
    }
    if (onAssemble) {
      this.sphere.row = this.row;
      this.sphere.setVlhs(
        this.center
          .clone()
          .add(
            this.fixedAxisVec
              .clone()
              .normalize()
              .multiplyScalar(this.initialLength)
          )
      );
      this.sphere.setJacobianAndConstraints(phi_q, phi);
      return;
    }

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
    const sFixed = fixedLocalVec.map((v) => v.clone());
    if (!this.isFixed) sFixed.forEach((p) => p.applyQuaternion(qFixed));

    const pRes = res.position.clone();
    const qRes = res.quaternion;
    const ARes = rotationMatrix(qRes);
    const GRes = decompositionMatrixG(qRes);

    // 軸を作成
    const axis = resLocalVec.clone().applyQuaternion(qRes).add(pRes);
    if (!this.isFixed) {
      axis.sub(sFixed[0].clone().add(pFixed));
    } else {
      axis.sub(sFixed[0]);
    }
    // 並行拘束
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
      phi_q.setSubMatrix(orthoVecT, row + r, cRes + X);
      phi[r + row] = orthoVec.dot(axis);
      const dRes = orthoVecT.mmul(axisDeltaQ); // (1x3) x (3x4) = (1x4)
      if (isFullDegreesComponent(res)) {
        phi_q.setSubMatrix(dRes, row + 3 + r, cRes + Q0);
      }
    }
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}

export function isLinearBushingSingleEnd(
  constraint: Constraint
): constraint is LinearBushingSingleEnd {
  return constraint.className === 'LinearBushingSingleEnd';
}

export class QuaternionConstraint implements Constraint {
  readonly className = 'QuaternionConstraint';

  // 自由度を1減らす
  constraints() {
    return 1;
  }

  active() {
    return true;
  }

  resetStates(): void {}

  readonly isInequalityConstraint = false;

  row: number = -1;

  IComponent: IComponent;

  relevantVariables: IComponent[];

  name: string;

  constructor(name: string, component: FullDegreesComponent) {
    this.name = name;
    this.IComponent = component;

    this.relevantVariables = [component];
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

const pointToPlaneClassName = 'PointToPlane' as const;
type PointToPlaneClassName = typeof pointToPlaneClassName;
export class PointToPlane implements Constraint, deltaL {
  readonly className: PointToPlaneClassName = pointToPlaneClassName;

  // 自由度を1減らす
  constraints() {
    return 1;
  }

  active() {
    return true;
  }

  resetStates(): void {
    this._dl = 0;
  }

  readonly isInequalityConstraint = false;

  row: number = -1;

  component: IComponent;

  relevantVariables: IComponent[];

  _localVec: (normal: Vector3, distance: number) => Vector3;

  get localVec(): Vector3 {
    return this._localVec(this.normal, this.distance);
  }

  get localSkew(): Matrix {
    return skew(this._localVec(this.normal, this.distance)).mul(-2);
  }

  distance: number;

  normal: Vector3;

  name: string;

  target: Vector3 = new Vector3();

  dlMin: number = Number.MIN_SAFE_INTEGER;

  dlMax: number = Number.MAX_SAFE_INTEGER;

  private _dl: number = 0;

  hasDl = true as const;

  set dl(value: number) {
    this._dl = Math.min(
      this.dlMax,
      Math.max(this.dlMin, value * this.component.scale)
    );
  }

  get dl(): number {
    return this._dl / this.component.scale;
  }

  elementID: string;

  readonly controledBy: string[];

  get controled() {
    return this.controledBy.length > 0;
  }

  constructor(
    name: string,
    component: IComponent,
    localVec: (normal: Vector3, distance: number) => Vector3,
    origin: Vector3,
    normal: Vector3,
    elementID: string,
    controledBy: string[],
    dlMin?: number,
    dlMax?: number
  ) {
    this.name = name;
    this.controledBy = controledBy;
    this.component = component;
    this.relevantVariables = [component];
    this._localVec = localVec;
    this.normal = normal?.clone().normalize() ?? new Vector3(0, 0, 1);
    this.distance =
      origin?.clone().multiplyScalar(component.scale).dot(normal) ?? 0;
    this.elementID = elementID;
    if (dlMin !== undefined) this.dlMin = dlMin * component.scale;
    if (dlMax !== undefined) this.dlMax = dlMax * component.scale;
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row, component, localVec, localSkew, normal, distance, _dl} = this;
    const {col, position, quaternion: q} = component;
    const A = rotationMatrix(q);
    const G = decompositionMatrixG(q);
    const s = localVec.clone().applyQuaternion(q);
    const nT = new Matrix([[normal.x, normal.y, normal.z]]); // (1x3)

    // 平面拘束
    phi[row] = position.clone().add(s).dot(normal) - distance - _dl;
    // 平面拘束方程式の変分
    phi_q.setSubMatrix(nT, row, col + X);
    if (isFullDegreesComponent(component)) {
      // (1x3) * (3x3) * (3x3) * (3x4) → (1x4)
      phi_q.setSubMatrix(nT.mmul(A).mmul(localSkew).mmul(G), row, col + Q0);
    }
  }

  setJacobianAndConstraintsInequal() {
    throw new Error('未実装');
  }

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}

export function isPointToPlane(
  constraint: Constraint
): constraint is PointToPlane {
  return constraint.className === pointToPlaneClassName;
}
