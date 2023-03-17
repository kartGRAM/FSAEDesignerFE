import {v4 as uuidv4} from 'uuid';
import {KinematicSolver} from '@gd/kinematics/Solver';

export interface IDataControl {
  readonly nodeID: string;
  readonly name?: string;
  readonly className: string;
  readonly type: ControllerTypes;
  readonly targetElement: string;
  readonly inputButton: string;
}

export type ControllerTypes = 'keyboard' | 'joystick' | 'notAssigned';

export abstract class Control {
  readonly nodeID: string;

  abstract get className(): string;

  private _name: string | undefined;

  abstract nameDefault(): string;

  get name(): string {
    return this._name ?? this.nameDefault();
  }

  set name(value: string) {
    this._name = value;
  }

  type: ControllerTypes;

  targetElement: string;

  inputButton: string;

  constructor(
    control:
      | IDataControl
      | {
          name?: string;
          type: ControllerTypes;
          targetElement: string;
          inputButton: string;
          nodeID?: string;
        }
  ) {
    this._name = control.name;
    this.nodeID = control.nodeID ?? uuidv4();
    this.type = control.type;
    this.targetElement = control.targetElement;
    this.inputButton = control.inputButton;
  }

  getDataControlBase(): IDataControl {
    return {
      nodeID: this.nodeID,
      name: this._name,
      className: this.className,
      type: this.type,
      targetElement: this.targetElement,
      inputButton: this.inputButton
    };
  }

  abstract preprocess(dt: number, solver: KinematicSolver): void;

  abstract getDataControl(): IDataControl;
}
