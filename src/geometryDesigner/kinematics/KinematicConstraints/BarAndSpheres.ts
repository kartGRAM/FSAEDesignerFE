/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {Constraint, ConstraintsOptions} from '@gd/kinematics/IConstraint';
import {IScalar} from '@computationGraph/IScalar';
import {VariableVector3} from '@computationGraph/VariableVector3';
import {ConstantVector3} from '@computationGraph/ConstantVector3';
import {ConstantScalar} from '@computationGraph/ConstantScalar';
import {VariableQuaternion} from '@computationGraph/VariableQuaternion';
import {IComponent} from '../KinematicComponents';
import {deltaL} from '../KinematicConstraints';

const X = 0;

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
