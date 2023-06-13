import store from '@store/store';
import {getControl} from '@gd/controls/Controls';
import {KinematicSolver} from '@gd/kinematics/Solver';
import {Control, IDataControl, ControllerTypes} from './IControls';

export const className = 'ExistingConstraintControl' as const;
type ClassName = typeof className;

export interface IDataExistingConstraintControl extends IDataControl {
  readonly className: ClassName;
  readonly targetControl: string;
}

export function isDataExistingConstraintControl(
  control: IDataControl | undefined | null
): control is IDataExistingConstraintControl {
  if (!control) return false;
  return control.className === className;
}

export class ExistingConstraintControl extends Control {
  readonly className = className;

  targetControl: string;

  constructor(
    control:
      | IDataExistingConstraintControl
      | {
          type: ControllerTypes;
          inputButton: string;
          nodeID?: string;
          speed?: number;
          reverse?: boolean;
          targetControl?: string;
        }
  ) {
    super({...control, targetElement: ''});
    this.speed = control.speed ?? 10;
    this.reverse = control.reverse ?? false;
    this.targetControl = control.targetControl ?? '';
  }

  nameDefault(): string {
    const {controls} = store.getState().dgd.present;
    const dataControl = controls.find(
      (control) => control.nodeID === this.targetControl
    );
    if (!dataControl) return 'target control is not found';
    const control = getControl(dataControl);
    return `Onother control of ${control.name}`;
  }

  preprocess(dt: number, solver: KinematicSolver): void {
    const {controls} = store.getState().dgd.present;
    const dataControl = controls.find(
      (control) => control.nodeID === this.targetControl
    );
    if (!dataControl) return;
    const dtMod =
      ((dt * this.speed) / dataControl.speed) *
      (this.reverse ? -1 : 1) *
      (dataControl.reverse ? -1 : 1);
    const control = getControl(dataControl);
    control.preprocess(dtMod, solver);
  }

  getDataControl(): IDataExistingConstraintControl {
    const data = super.getDataControlBase();
    return {
      ...data,
      className: this.className,
      targetControl: this.targetControl,
      speed: this.speed,
      reverse: this.reverse
    };
  }
}

export function isExistingConstraintControl(
  control: Control | undefined | null
): control is ExistingConstraintControl {
  if (!control) return false;
  return control.className === className;
}
