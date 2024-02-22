import {IDataFormula} from '@gd/IFormula';

type IDOFState = number[];
type IConstrainsState = number[];

export interface ISnapshot {
  dofState: {[index: string]: IDOFState};
  constraintsState: {[index: string]: IConstrainsState};
  solverParameters?: unknown;
  measureTools?: MeasureSnapshot;
  readonlyVariables?: ROVariablesSnapshot;
  globals?: IDataFormula[];
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
