import {IDataFormula} from '@gd/IFormula';

type IDOFState = number[];
type IConstrainsState = number[];

export interface ISnapshot {
  dofState: {[index: string]: IDOFState};
  constraintsState: {[index: string]: IConstrainsState};
  solverState?: unknown;
  measureTools?: MeasureSnapshot;
  readonlyVariables?: ROVariablesSnapshot;
  globals?: IDataFormula[];
  globalsUpdateID?: string;
}

export type MeasureSnapshot = {
  [index: string]: {
    readonly name: string;
    readonly values: {[index: string]: number};
  };
};

export type ROVariablesSnapshot = {
  [index: string]: {
    readonly name: string;
    readonly value: number;
  };
};
