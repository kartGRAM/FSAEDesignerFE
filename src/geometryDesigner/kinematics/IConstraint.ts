import {Matrix} from 'ml-matrix';
import {IVariable} from './KinematicComponents';

export interface ConstraintsOptions {
  disableForce?: boolean;
  disableTireFriction?: boolean;
  disableSpringElasticity?: boolean;
  fixSpringDumpersAtCurrentPositions?: boolean;
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
