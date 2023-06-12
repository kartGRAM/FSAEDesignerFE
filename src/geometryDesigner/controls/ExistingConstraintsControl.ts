import store from '@store/store';
import {getControl} from '@gd/controls/Controls';
import {KinematicSolver} from '@gd/kinematics/Solver';
import {Control, IDataControl, ControllerTypes} from './IControls';

export const className = 'ExistingConstraintsControl' as const;
type ClassName = typeof className;

export interface IDataExistingConstraintsControl extends IDataControl {
  readonly className: ClassName;
  readonly targetNodeID: string;
}

export function isDataExistingConstraintsControl(
  control: IDataControl | undefined | null
): control is IDataExistingConstraintsControl {
  if (!control) return false;
  return control.className === className;
}

export class ExistingConstraintsControl extends Control {
  readonly className = className;

  targetNodeID: string;

  constructor(
    control:
      | IDataExistingConstraintsControl
      | {
          type: ControllerTypes;
          inputButton: string;
          nodeID?: string;
          speed?: number;
          reverse?: boolean;
          targetNodeID?: string;
        }
  ) {
    super({...control, targetElement: ''});
    this.speed = control.speed ?? 10;
    this.reverse = control.reverse ?? false;
    this.targetNodeID = control.targetNodeID ?? '';
  }

  nameDefault(): string {
    const {controls} = store.getState().dgd.present;
    const dataControl = controls.find(
      (control) => control.nodeID === this.targetNodeID
    );
    if (!dataControl) return 'target control is not found';
    const control = getControl(dataControl);
    return `Onother control of ${control.name}`;
  }

  preprocess(dt: number, solver: KinematicSolver): void {
    const {controls} = store.getState().dgd.present;
    const dataControl = controls.find(
      (control) => control.nodeID === this.targetNodeID
    );
    if (!dataControl) return;
    const dtMod =
      ((dt * this.speed) / dataControl.speed) *
      (this.reverse ? -1 : 1) *
      (dataControl.reverse ? -1 : 1);
    const control = getControl(dataControl);
    control.preprocess(dtMod, solver);
  }

  getDataControl(): IDataExistingConstraintsControl {
    const data = super.getDataControlBase();
    return {
      ...data,
      className: this.className,
      targetNodeID: this.targetNodeID,
      speed: this.speed,
      reverse: this.reverse
    };
  }
}

export function isExistingConstraintsControl(
  control: Control | undefined | null
): control is ExistingConstraintsControl {
  if (!control) return false;
  return control.className === className;
}
