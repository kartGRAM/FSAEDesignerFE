/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {Constraint} from '@gd/kinematics/IConstraint';
import {IVector3} from '@computationGraph/IVector3';
import {IScalar} from '@computationGraph/IScalar';
import {VariableVector3} from '@computationGraph/VariableVector3';
import {ConstantVector3} from '@computationGraph/ConstantVector3';
import {ConstantScalar} from '@computationGraph/ConstantScalar';
import {VariableQuaternion} from '@computationGraph/VariableQuaternion';
import {IComponent} from '../KinematicComponents';
import {deltaL} from '../KinematicConstraints';

export class PointToPlane implements Constraint, deltaL {
  static readonly className = 'PointToPlane' as const;

  readonly className = PointToPlane.className;

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

  saveState(): number[] {
    return [this._dl];
  }

  restoreState(state: number[]): void {
    [this._dl] = state;
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
  return constraint.className === PointToPlane.className;
}
