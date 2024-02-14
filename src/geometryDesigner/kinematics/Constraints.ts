/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {isObject} from '@utils/helpers';
import {Constraint, ConstraintsOptions} from '@gd/kinematics/IConstraint';
import {IVector3} from '@computationGraph/IVector3';
import {IScalar} from '@computationGraph/IScalar';
import {getVVector} from '@computationGraph/Functions';
import {VariableVector3} from '@computationGraph/VariableVector3';
import {ConstantVector3} from '@computationGraph/Vector3';
import {ConstantScalar} from '@computationGraph/ConstantScalar';
import {VariableQuaternion} from '@computationGraph/VariableQuaternion';
import {getStableOrthogonalVector} from './KinematicFunctions';
import {IComponent, FullDegreesComponent} from './KinematicComponents';

const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;
const Q1 = 4;
const Q2 = 5;
const Q3 = 6;

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

  name: string;

  constraint: IVector3;

  pLhs: VariableVector3;

  qLhs: VariableQuaternion;

  pRhs: VariableVector3;

  qRhs: VariableQuaternion;

  lLocalVec: ConstantVector3;

  rLocalVec: ConstantVector3;

  setVlhs(vlhs: Vector3): void {
    this.lLocalVec.value = getVVector(vlhs);
  }

  setVrhs(vrhs: Vector3): void {
    this.rLocalVec.value = getVVector(vrhs);
  }

  constructor(
    name: string,
    clhs: IComponent,
    crhs: IComponent,
    vlhs?: Vector3,
    vrhs?: Vector3
  ) {
    this.name = name;
    this.lhs = clhs;
    this.rhs = crhs;
    this.relevantVariables = [this.lhs, this.rhs];

    const lLocalVec = vlhs?.clone().multiplyScalar(clhs.scale) ?? new Vector3();
    const rLocalVec = vrhs?.clone().multiplyScalar(crhs.scale) ?? new Vector3();

    this.pLhs = clhs.positionVariable;
    this.qLhs = clhs.quaternionVariable;
    this.pRhs = crhs.positionVariable;
    this.qRhs = crhs.quaternionVariable;
    const ALhs = this.qLhs.getRotationMatrix();
    const ARhs = this.qRhs.getRotationMatrix();

    this.lLocalVec = new ConstantVector3(lLocalVec);
    this.rLocalVec = new ConstantVector3(rLocalVec);

    const sLhs = ALhs.vmul(this.lLocalVec);
    const sRhs = ARhs.vmul(this.rLocalVec);

    this.constraint = this.pLhs.add(sLhs).sub(this.pRhs).sub(sRhs);
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row} = this;

    this.pLhs.setValue(this.lhs.position);
    this.pRhs.setValue(this.rhs.position);
    this.qLhs.setValue(this.lhs.quaternion);
    this.qRhs.setValue(this.rhs.quaternion);
    this.constraint.reset({});
    const error = this.constraint.vector3Value;
    this.constraint.diff(Matrix.eye(3, 3));
    phi[row + X] = error.x;
    phi[row + Y] = error.y;
    phi[row + Z] = error.z;
    this.constraint.setJacobian(phi_q, row + X);
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

  name: string;

  pLhs: VariableVector3;

  qLhs: VariableQuaternion;

  pRhs: VariableVector3;

  qRhs: VariableQuaternion;

  positionError: IVector3;

  directionError: IScalar[];

  constructor(
    name: string,
    clhs: FullDegreesComponent,
    crhs: FullDegreesComponent,
    vlhs: [Vector3, Vector3],
    vrhs: [Vector3, Vector3]
  ) {
    this.name = name;
    this.lhs = clhs;
    this.rhs = crhs;
    this.relevantVariables = [this.lhs, this.rhs];

    const {scale} = clhs;
    this.pLhs = clhs.positionVariable;
    this.qLhs = clhs.quaternionVariable;
    this.pRhs = crhs.positionVariable;
    this.qRhs = crhs.quaternionVariable;
    const ALhs = this.qLhs.getRotationMatrix();
    const ARhs = this.qRhs.getRotationMatrix();

    const lLocalVec = vlhs.map(
      (vlhs) => new ConstantVector3(vlhs.clone().multiplyScalar(scale))
    );
    const rLocalVec = vrhs.map(
      (vrhs) => new ConstantVector3(vrhs.clone().multiplyScalar(scale))
    );

    const sLhs = ALhs.vmul(lLocalVec[0]);
    const sRhs = ARhs.vmul(rLocalVec[0]);

    this.positionError = this.pLhs.add(sLhs).sub(this.pRhs).sub(sRhs);

    const lAxisVec = lLocalVec[1].sub(lLocalVec[0]);
    const rAxisVec = rLocalVec[1].sub(rLocalVec[0]);
    const lAxisVecValue = lAxisVec.vector3Value;
    if (
      rAxisVec.vector3Value.lengthSq() < Number.EPSILON ||
      lAxisVecValue.lengthSq() < Number.EPSILON
    ) {
      throw new Error('ヒンジを構成する2点が近すぎます');
    }
    const oVec1 = getStableOrthogonalVector(lAxisVecValue);
    const oVec2 = lAxisVecValue.cross(oVec1).normalize();

    const lOrthogonalVec = [
      ALhs.vmul(new ConstantVector3(oVec1)),
      ALhs.vmul(new ConstantVector3(oVec2))
    ];

    this.directionError = lOrthogonalVec.map((orthoVec) => {
      const axis = ARhs.vmul(rAxisVec);
      return orthoVec.dot(axis);
    });
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row} = this;

    this.pLhs.setValue(this.lhs.position);
    this.pRhs.setValue(this.rhs.position);
    this.qLhs.setValue(this.lhs.quaternion);
    this.qRhs.setValue(this.rhs.quaternion);

    // 始点位置拘束
    this.positionError.reset({});
    const error = this.positionError.vector3Value;
    this.positionError.diff(Matrix.eye(3, 3));

    phi[row + X] = error.x;
    phi[row + Y] = error.y;
    phi[row + Z] = error.z;
    this.positionError.setJacobian(phi_q, row);

    // 並行拘束
    this.directionError.forEach((directionError, i) => {
      // pは登場しない
      directionError.reset({variablesOnly: false});
      const error = directionError.scalarValue;
      directionError.diff(Matrix.eye(1, 1));

      phi[row + 3 + i] = error;
      directionError.setJacobian(phi_q, row + 3 + i);
    });
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
    const {disableSpringElasticity, fixSpringDumpersAtCurrentPositions} =
      options;
    if (disableSpringElasticity) return 1;
    if (this.isSpringDumper && fixSpringDumpersAtCurrentPositions) return 1;
    if (this.isSpringDumper) return 0;
    return 1;
  }

  active(options: ConstraintsOptions) {
    const {disableSpringElasticity, fixSpringDumpersAtCurrentPositions} =
      options;
    if (disableSpringElasticity) return true;
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

  rLocalVec: Vector3;

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
    if (this.controled) return this._dl / this.lhs.scale;
    return (
      (this.getDistanceOfEndPoints() - Math.sqrt(this.l2_)) / this.lhs.scale
    );
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

  pLhs: VariableVector3;

  qLhs: VariableQuaternion;

  pRhs: VariableVector3;

  qRhs: VariableQuaternion;

  l2_: number;

  l2: ConstantScalar;

  error: IScalar;

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
    this.lhs = clhs;
    this.rhs = crhs;
    this.relevantVariables = [this.lhs, this.rhs];
    if (dlMin) this.dlMin = dlMin * this.lhs.scale;
    if (dlMax) this.dlMax = dlMax * this.lhs.scale;
    this.lLocalVec = vlhs?.clone().multiplyScalar(clhs.scale) ?? new Vector3();
    this.rLocalVec = vrhs?.clone().multiplyScalar(crhs.scale) ?? new Vector3();

    this.pLhs = clhs.positionVariable;
    this.qLhs = clhs.quaternionVariable;
    this.pRhs = crhs.positionVariable;
    this.qRhs = crhs.quaternionVariable;
    const ALhs = this.qLhs.getRotationMatrix();
    const ARhs = this.qRhs.getRotationMatrix();

    const lLocalVec = new ConstantVector3(this.lLocalVec);
    const rLocalVec = new ConstantVector3(this.rLocalVec);

    const sLhs = ALhs.vmul(lLocalVec);
    const sRhs = ARhs.vmul(rLocalVec);

    const d = this.pLhs.add(sLhs).sub(this.pRhs).sub(sRhs);

    const ls = l * clhs.scale;
    this.l2_ = ls * ls;
    this.l2 = new ConstantScalar(this.l2_);
    this.error = d.dot(d).sub(this.l2);
  }

  setJacobianAndConstraints(
    phi_q: Matrix,
    phi: number[],
    options: ConstraintsOptions
  ) {
    const {disableSpringElasticity, fixSpringDumpersAtCurrentPositions} =
      options;
    if (
      !disableSpringElasticity &&
      this.isSpringDumper &&
      !fixSpringDumpersAtCurrentPositions
    )
      return;
    let {l2_} = this;
    if (this.isSpringDumper && fixSpringDumpersAtCurrentPositions)
      l2_ = this.getDistanceOfEndPoints() ** 2;
    if (this.controled) l2_ = (Math.sqrt(l2_) + this._dl) ** 2;
    this.setJacobianAndConstraintsImpl(l2_, phi_q, phi);
  }

  setJacobianAndConstraintsInequal(
    phi_q: Matrix,
    phi: number[],
    hint: any
  ): number {
    const l = Math.sqrt(this.l2_);
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
    const l = Math.sqrt(this.l2_);
    const lMin = l + this.dlMin - Number.EPSILON;
    const lMax = l + this.dlMax + Number.EPSILON;
    let hint = 0;
    if (d < lMin) hint = -1;
    if (d > lMax) hint = 1;
    return [d < lMin || lMax < d, hint];
  }

  setJacobianAndConstraintsImpl(l2: number, phi_q: Matrix, phi: number[]) {
    const {row} = this;

    this.pLhs.setValue(this.lhs.position);
    this.pRhs.setValue(this.rhs.position);
    this.qLhs.setValue(this.lhs.quaternion);
    this.qRhs.setValue(this.rhs.quaternion);
    this.l2.setValue(l2);

    this.error.reset({});
    const error = this.error.scalarValue;
    this.error.diff(Matrix.eye(1, 1));
    phi[row + X] = error;
    this.error.setJacobian(phi_q, row);
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
    const {fixLinearBushing} = options;
    // 組み立て時は固定する
    if (fixLinearBushing) return 3;
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

  name: string;

  dlMin: number = Number.MIN_SAFE_INTEGER;

  dlMax: number = Number.MAX_SAFE_INTEGER;

  sphere: Sphere;

  pFixed: VariableVector3;

  qFixed: VariableQuaternion;

  pRes: VariableVector3;

  qRes: VariableQuaternion;

  error: IScalar[];

  centerValue: Vector3;

  fixedAxisVecValue: Vector3;

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
    const fixedLocalVec = [
      new ConstantVector3(vFixed[0].clone().multiplyScalar(cFixed.scale)),
      new ConstantVector3(vFixed[1].clone().multiplyScalar(cFixed.scale))
    ];
    const center = fixedLocalVec[1].add(fixedLocalVec[0]).mul(0.5);
    this.centerValue = center.vector3Value;
    const fixedAxisVec = fixedLocalVec[1].sub(fixedLocalVec[0]);
    this.fixedAxisVecValue = fixedAxisVec.vector3Value;
    if (this.fixedAxisVecValue.lengthSq() < Number.EPSILON) {
      throw new Error('リニアブッシュを保持するする2点が近すぎます');
    }
    const vRE = vRodEndSide?.clone().multiplyScalar(cRodEndSide.scale);

    this.name = name;
    if (dlMin) this.dlMin = dlMin * cFixed.scale;
    if (dlMax) this.dlMax = dlMax * cFixed.scale;
    if (cRodEndSide.isFixed) {
      throw new Error('RodEnd側が固定されている');
    }

    const resLocalVec = new ConstantVector3(vRE?.clone() ?? new Vector3());

    const oVec1 = getStableOrthogonalVector(this.fixedAxisVecValue);
    const oVec2 = this.fixedAxisVecValue.clone().cross(oVec1).normalize();
    const fixedOrthogonalVec = [
      new ConstantVector3(oVec1),
      new ConstantVector3(oVec2)
    ];

    this.pFixed = cFixed.positionVariable;
    this.qFixed = cFixed.quaternionVariable;
    this.pRes = cRodEndSide.positionVariable;
    this.qRes = cRodEndSide.quaternionVariable;
    const AFixed = this.qFixed.getRotationMatrix();
    const ARes = this.qRes.getRotationMatrix();
    const sFixed = fixedLocalVec.map((localVec) => AFixed.vmul(localVec));

    const axis = this.pRes
      .add(ARes.vmul(resLocalVec))
      .sub(sFixed[0].add(this.pFixed));

    this.error = fixedOrthogonalVec.map((v) => {
      const orthoVec = AFixed.vmul(v);
      return orthoVec.dot(axis);
    });

    this.sphere = new Sphere(
      name,
      this.fixed,
      this.res,
      this.centerValue
        .clone()
        .multiplyScalar(1 / cFixed.scale)
        .add(
          fixedAxisVec.vector3Value
            .clone()
            .normalize()
            .multiplyScalar(this.initialLength / cFixed.scale)
        ),
      vRE
    );
  }

  setJacobianAndConstraints(
    phi_q: Matrix,
    phi: number[],
    options: ConstraintsOptions
  ) {
    const {fixLinearBushing} = options;
    if (this.controled) {
      this.sphere.row = this.row;
      this.sphere.setVlhs(
        this.centerValue.clone().add(
          this.fixedAxisVecValue
            .clone()
            .normalize()
            .multiplyScalar(this.initialLength + this._dl)
        )
      );
      this.sphere.setJacobianAndConstraints(phi_q, phi);
      return;
    }
    if (fixLinearBushing) {
      this.sphere.row = this.row;
      this.sphere.setVlhs(
        this.centerValue
          .clone()
          .add(
            this.fixedAxisVecValue
              .clone()
              .normalize()
              .multiplyScalar(this.initialLength)
          )
      );
      this.sphere.setJacobianAndConstraints(phi_q, phi);
      return;
    }

    const {row} = this;

    this.pFixed.setValue(this.fixed.position);
    this.pRes.setValue(this.res.position);
    this.qFixed.setValue(this.fixed.quaternion);
    this.qRes.setValue(this.res.quaternion);

    this.error.forEach((error, i) => {
      error.reset({});
      phi[row + i] = error.scalarValue;
      error.diff(Matrix.eye(1, 1));
      error.setJacobian(phi_q, row + i);
    });
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

  p: VariableVector3;

  q: VariableQuaternion;

  distance: ConstantScalar;

  _distance: number;

  error: IScalar;

  relevantVariables: IComponent[];

  name: string;

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
    localVec: (
      normal: IVector3,
      distance: IScalar,
      q: VariableQuaternion
    ) => IVector3,
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
    this.p = component.positionVariable;
    this.q = component.quaternionVariable;
    const A = this.q.getRotationMatrix();
    this.relevantVariables = [component];
    const n = new ConstantVector3(
      normal?.clone().normalize() ?? new Vector3(0, 0, 1)
    );
    this._distance =
      origin?.clone().multiplyScalar(component.scale).dot(normal) ?? 0;
    this.distance = new ConstantScalar(this._distance);

    const r = localVec(n, this.distance, this.q);
    const s = A.vmul(r).add(this.p);
    this.error = n.dot(s).sub(this.distance);

    this.elementID = elementID;
    if (dlMin !== undefined) this.dlMin = dlMin * component.scale;
    if (dlMax !== undefined) this.dlMax = dlMax * component.scale;
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row, component, _distance, _dl} = this;
    const {position, quaternion: q} = component;
    this.p.setValue(position);
    this.q.setValue(q);
    this.distance.setValue(_distance + _dl);

    // 平面拘束
    this.error.reset({});
    phi[row] = this.error.scalarValue;
    this.error.diff(Matrix.eye(1, 1));
    this.error.setJacobian(phi_q, row);
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
