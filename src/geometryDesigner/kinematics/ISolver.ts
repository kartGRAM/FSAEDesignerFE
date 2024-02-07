import {ConstraintsOptions} from '@gd/kinematics/IConstraint';
import {IObjectiveFunction} from './Driver';
import {ISnapshot} from '../analysis/ISnapshot';
import {IVariable, IComponent} from './KinematicComponents';

export interface ISolver {
  readonly className: string;
  readonly running: boolean;
  readonly components: IVariable[][];
  readonly componentsFromNodeID: {[index: string]: IComponent};

  solve(params?: {
    fixSpringDumperAtCurrentPosition?: boolean;
    constraintsOptions?: ConstraintsOptions;
    maxCnt?: number;
    postProcess?: boolean;
    logOutput?: boolean;
  }): void;

  solveObjectiveFunction(
    func: IObjectiveFunction,
    params?: {
      maxCnt?: number;
      constraintsOptions?: ConstraintsOptions;
      ignoreInequalityConstraints?: boolean;
      postProcess?: boolean;
      logOutput?: boolean;
    }
  ): void;

  restoreInitialQ(): void;

  getSnapshot(): ISnapshot;
  restoreState(snapshot: ISnapshot): void;

  postProcess(): void;
}
