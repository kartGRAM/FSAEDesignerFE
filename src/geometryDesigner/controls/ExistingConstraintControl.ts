import {getControl} from '@gd/controls/Controls';
import {ISolver} from '@gd/kinematics/ISolver';
import {getDgd} from '@store/getDgd';
import {Control, IDataControl, ControllerTypes} from './IControls';

export interface IDataExistingConstraintControl extends IDataControl {
  readonly className: typeof ExistingConstraintControl.className;
  readonly targetControl: string;
}

export function isDataExistingConstraintControl(
  control: IDataControl | undefined | null
): control is IDataExistingConstraintControl {
  if (!control) return false;
  return control.className === ExistingConstraintControl.className;
}

export class ExistingConstraintControl extends Control {
  static className = 'ExistingConstraintControl' as const;

  readonly className = ExistingConstraintControl.className;

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
    super({...control, targetElements: []});
    this.speed = control.speed ?? 10;
    this.reverse = control.reverse ?? false;
    this.targetControl = control.targetControl ?? '';
  }

  nameDefault(): string {
    const {controls} = getDgd();
    const dataControl = controls.find(
      (control) => control.nodeID === this.targetControl
    );
    if (!dataControl) return 'target control is not found';
    const control = getControl(dataControl);
    return `Onother control of ${control.name}`;
  }

  preprocess(dt: number, solver: ISolver, value?: number): unknown {
    const {controls} = getDgd();
    const dataControl = controls.find(
      (control) => control.nodeID === this.targetControl
    );
    if (!dataControl) return 0;
    const dtMod =
      ((dt * this.speed) / dataControl.speed) *
      (this.reverse ? -1 : 1) *
      (dataControl.reverse ? -1 : 1);
    const control = getControl(dataControl);
    return control.preprocess(dtMod, solver, value);
  }

  rollback(data: unknown, solver: ISolver): void {
    const {controls} = getDgd();
    const dataControl = controls.find(
      (control) => control.nodeID === this.targetControl
    );
    if (!dataControl) return;
    const control = getControl(dataControl);
    control.rollback(data, solver);
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
  return control.className === ExistingConstraintControl.className;
}
