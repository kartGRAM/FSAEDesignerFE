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
import {VariableQuaternion} from '@computationGraph/VariableQuaternion';
import {getStableOrthogonalVector} from '../KinematicFunctions';
import {IComponent, FullDegreesComponent} from '../KinematicComponents';

const X = 0;
const Y = 1;
const Z = 2;

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

  saveState(): number[] {
    return [];
  }

  restoreState(): void {}

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row} = this;

    this.pLhs.setValue(this.lhs.position);
    this.pRhs.setValue(this.rhs.position);
    this.qLhs.setValue(this.lhs.quaternion);
    this.qRhs.setValue(this.rhs.quaternion);

    // 始点位置拘束
    let resetKey = this.positionError.reset({});
    const error = this.positionError.vector3Value;
    this.positionError.diff(Matrix.eye(3, 3));

    phi[row + X] = error.x;
    phi[row + Y] = error.y;
    phi[row + Z] = error.z;
    this.positionError.setJacobian(phi_q, row);

    // 並行拘束
    this.directionError.forEach((directionError, i) => {
      resetKey = directionError.reset({variablesOnly: false, resetKey});
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
