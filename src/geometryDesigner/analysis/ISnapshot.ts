import {IDOFState} from '@gd/IElements';

export interface ISnapshot {
  dofState: {[index: string]: IDOFState};
  controlState: {[index: string]: number};
}
