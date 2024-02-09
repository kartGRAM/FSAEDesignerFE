import {Matrix} from 'ml-matrix';

export type RetType = {value: Matrix; diff: (mat?: Matrix) => void};

export interface IComputationNode {
  readonly value: Matrix;
  readonly rows: number;

  diff(fromLhs?: Matrix, fromRhs?: Matrix): void;
}
