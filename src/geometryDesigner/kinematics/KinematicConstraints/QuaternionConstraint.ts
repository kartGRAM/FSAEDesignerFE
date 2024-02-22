/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
import {Matrix} from 'ml-matrix';
import {Constraint} from '@gd/kinematics/IConstraint';
import {IComponent, FullDegreesComponent} from '../KinematicComponents';

const Q0 = 3;
const Q1 = 4;
const Q2 = 5;
const Q3 = 6;

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

  saveState(): number[] {
    return [];
  }

  restoreState(): void {}

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
