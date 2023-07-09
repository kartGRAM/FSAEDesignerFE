import {v4 as uuidv4} from 'uuid';
import {KinematicSolver} from '@gd/kinematics/Solver';

export interface IDataControl {
  readonly nodeID: string;
  readonly name?: string;
  readonly className: string;
  readonly type: ControllerTypes;
  readonly targetElements: string[];
  readonly inputButton: string;
  readonly reverse: boolean;
  readonly speed: number; // mm/s or rad/s
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

  targetElements: string[];

  inputButton: string;

  speed: number;

  reverse: boolean;

  constructor(
    control:
      | IDataControl
      | {
          name?: string;
          type: ControllerTypes;
          targetElements: string[];
          inputButton: string;
          speed?: number;
          reverse?: boolean;
          nodeID?: string;
        }
  ) {
    this._name = control.name;
    this.nodeID = control.nodeID ?? uuidv4();
    this.type = control.type;
    this.targetElements = control.targetElements ?? [];
    this.inputButton = control.inputButton;
    this.speed = control.speed ?? 10;
    this.reverse = control.reverse ?? false;
  }

  getDataControlBase(): IDataControl {
    return {
      nodeID: this.nodeID,
      name: this.name,
      className: this.className,
      type: this.type,
      targetElements: this.targetElements,
      inputButton: this.inputButton,
      speed: this.speed,
      reverse: this.reverse
    };
  }

  abstract preprocess(
    dt: number,
    solver: KinematicSolver,
    value?: number
  ): unknown;

  abstract rollback(data: unknown, solver: KinematicSolver): void;

  abstract getDataControl(): IDataControl;
}
