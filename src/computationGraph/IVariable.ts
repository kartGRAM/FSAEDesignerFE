import {Matrix} from 'ml-matrix';

export interface IVariable {
  setValue(value: unknown): void;
  setJacobian(phi_q: Matrix, row: number, col: number): void;
}
