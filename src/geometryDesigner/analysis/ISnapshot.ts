import {IDataFormula} from '@gd/IFormula';

type IDOFState = number[];

export interface ISnapshot {
  dofState: {[index: string]: IDOFState};
  constrainsState: {[index: string]: number};
  measureTools?: MeasureSnapshot;
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
    readonly values: {[index: string]: number};
  };
};
