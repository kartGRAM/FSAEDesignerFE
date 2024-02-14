import {Matrix} from 'ml-matrix';

export type RetType = {
  value: () => Matrix;
  diff: (fromLhs: Matrix, fromRhs?: Matrix) => void;
};

export interface ResetOptions {
  variablesOnly?: boolean;
}

export interface IComputationNode {
  readonly value: Matrix;
  reset(options: ResetOptions): void;
  diff(fromLhs: Matrix, fromRhs?: Matrix): void;
}
