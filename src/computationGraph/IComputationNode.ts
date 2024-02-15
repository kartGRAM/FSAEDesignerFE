import {Matrix} from 'ml-matrix';

export type RetType = {
  value: () => Matrix;
  diff: (fromLhs: Matrix, fromRhs?: Matrix) => void;
};

export interface ResetOptions {
  variablesOnly?: boolean;
  id?: number;
}

export interface IComputationNode {
  readonly value: Matrix;
  reset(options: ResetOptions): number;
  diff(fromLhs: Matrix, fromRhs?: Matrix): void;
  setJacobian(phi_q: Matrix, row: number): void;
}
