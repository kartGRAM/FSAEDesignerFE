type IDOFState = number[];

export interface ISnapshot {
  dofState: {[index: string]: IDOFState};
  controlState: {[index: string]: number};
  measureTools?: MeasureSnapshot;
}

export type MeasureSnapshot = {
  [index: string]: {
    readonly name: string;
    readonly values: {[index: string]: number};
  };
};
