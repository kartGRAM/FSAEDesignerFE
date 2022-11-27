/* eslint-disable max-classes-per-file */
import {
  IControl,
  ControllerTypes,
  ILinearBushingControl,
  isILinearBushingControl
} from '@gd/IControls';
import {v4 as uuidv4} from 'uuid';
import store from '@store/store';

export abstract class Control {
  readonly nodeID: string;

  abstract get className(): string;

  type: ControllerTypes;

  targetElement: string;

  inputButton: string;

  constructor(
    control:
      | IControl
      | {
          type: ControllerTypes;
          targetElement: string;
          inputButton: string;
          nodeID?: string;
        }
  ) {
    this.nodeID = control.nodeID ?? uuidv4();
    this.type = control.type;
    this.targetElement = control.targetElement;
    this.inputButton = control.inputButton;
  }

  getDataControlBase(): IControl {
    return {
      nodeID: this.nodeID,
      className: this.className,
      type: this.type,
      targetElement: this.targetElement,
      inputButton: this.inputButton
    };
  }

  abstract solve(dt: number): void;

  abstract getDataControl(): IControl;
}

export class LinearBushingControl extends Control {
  readonly className = 'LinearBushing' as const;

  reverse: boolean;

  speed: number; // mm/s

  constructor(
    control:
      | ILinearBushingControl
      | {
          type: ControllerTypes;
          targetElement: string;
          inputButton: string;
          nodeID?: string;
          speed?: number;
          reverse?: boolean;
        }
  ) {
    super(control);
    this.speed = control.speed ?? 10;
    this.reverse = control.reverse ?? false;
  }

  solve(dt: number): void {
    const solver = store.getState().uitgd.kinematicSolver;
    if (!solver) throw new Error('solverがない');
  }

  getDataControl(): ILinearBushingControl {
    const data = super.getDataControlBase();
    return {
      ...data,
      className: this.className,
      speed: this.speed,
      reverse: this.reverse
    };
  }
}

export function isLinearBushingControl(
  control: Control | undefined | null
): control is LinearBushingControl {
  if (!control) return false;
  return control.className === 'LinearBushing';
}

export function getControl(control: IControl): Control {
  if (isILinearBushingControl(control))
    return new LinearBushingControl(control);
  throw Error('Not Supported Exception');
}
