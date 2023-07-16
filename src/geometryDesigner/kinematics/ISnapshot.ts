type IDOFState = number[];

export interface ISnapshot {
  dofState: {[index: string]: IDOFState};
  controlState: {[index: number]: number};
}
