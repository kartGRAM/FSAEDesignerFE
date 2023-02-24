/* eslint-disable max-classes-per-file */
import {
  IControl,
  ControllerTypes,
  ILinearBushingControl,
  isILinearBushingControl
} from '@gd/controls/IControls';
import {v4 as uuidv4} from 'uuid';
import {
  LinearBushingSingleEnd,
  isLinearBushingSingleEnd
} from '@gd/kinematics/Constraints';
import {KinematicSolver} from '@gd/kinematics/Solver';
import store from '@store/store';

export abstract class Control {
  readonly nodeID: string;

  abstract get className(): string;

  private _name: string | undefined;

  abstract nameDefault(): string;

  get name(): string {
    return this.name ?? this.nameDefault();
  }

  set name(value: string) {
    this._name = value;
  }

  type: ControllerTypes;

  targetElement: string;

  inputButton: string;

  constructor(
    control:
      | IControl
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

  getDataControlBase(): IControl {
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

  nameDefault(): string {
    const elements = store.getState().uitgd.collectedAssembly?.children;
    const element = elements?.find((e) => e.nodeID === this.targetElement);
    if (!element) return 'component not found';
    return `position of ${element.name.value}`;
  }

  preprocess(dt: number, solver: KinematicSolver): void {
    const deltaDl = dt * this.speed * (this.reverse ? -1 : 1);
    const roots = solver.components.map((c) => c[0]);
    const constraints = roots.reduce((prev, current) => {
      prev.push(
        ...(current
          .getGroupedConstraints()
          .filter(
            (c) =>
              isLinearBushingSingleEnd(c) && c.elementID === this.targetElement
          ) as LinearBushingSingleEnd[])
      );
      return prev;
    }, [] as LinearBushingSingleEnd[]);
    constraints.forEach((constraint) => {
      constraint.dl += deltaDl;
      constraint.dl = Math.min(
        constraint.dlMax,
        Math.max(constraint.dlMin, constraint.dl)
      );
    });
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
