import {Matrix} from 'ml-matrix';

export interface IVariable {
  setJacobian(phi_q: Matrix, row: number, col: number): void;
}
