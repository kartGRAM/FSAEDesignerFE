/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {Constraint} from '@gd/kinematics/IConstraint';
import {IVector3} from '@computationGraph/IVector3';
import {getVVector} from '@computationGraph/Functions';
import {VariableVector3} from '@computationGraph/VariableVector3';
import {ConstantVector3} from '@computationGraph/ConstantVector3';
import {VariableQuaternion} from '@computationGraph/VariableQuaternion';
import {IComponent} from '../KinematicComponents';

const X = 0;
const Y = 1;
const Z = 2;
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
