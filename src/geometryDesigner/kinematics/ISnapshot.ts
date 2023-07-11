type IDOFState = number[];

export interface ISnapshot {
  dofState: {[index: number]: IDOFState};
  controlState: {[index: number]: number};
}
