import {IObjectiveFunction} from './Driver';
import {ConstraintsOptions} from './Constraints';
import {ISnapshot} from '../analysis/ISnapshot';
import {IComponent} from './KinematicComponents';

export interface ISolver {
  running: boolean;
  componentsFromNodeID: {[index: string]: IComponent};

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
