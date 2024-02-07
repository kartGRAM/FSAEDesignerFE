import {IDataNumber, INamedNumber} from '@gd/INamedValues';
import {ISolver} from '@gd/kinematics/ISolver';
import {isSkidpadSolver} from '@gd/kinematics/SkidpadSolver';
import {NamedNumber} from '@gd/NamedValues';
import {Control, IDataControl, ControllerTypes} from './IControls';

export interface IDataSkidpadSolverControl extends IDataControl {
  readonly className: typeof SkidpadSolverControl.className;
  maxV: IDataNumber;

  minV: IDataNumber;
}

export function isDataSkidpadSolverControl(
  control: IDataControl | undefined | null
): control is IDataSkidpadSolverControl {
  if (!control) return false;
  return control.className === SkidpadSolverControl.className;
}

export class SkidpadSolverControl extends Control {
  static className = 'SkidpadSolverControl' as const;

  readonly className = SkidpadSolverControl.className;

  maxV: INamedNumber;

  minV: INamedNumber;

  constructor(
    control:
      | IDataSkidpadSolverControl
      | {
          type: ControllerTypes;
          inputButton: string;
          nodeID?: string;
          maxV?: string | number | IDataNumber | INamedNumber;
          minV?: string | number | IDataNumber | INamedNumber;
          reverse?: boolean;
        }
  ) {
    super({targetElements: [], ...control});
    const {maxV, minV} = control;
    this.maxV = new NamedNumber({
      name: 'max',
      value: maxV ?? 10
    });
    this.minV = new NamedNumber({
      name: 'min',
      value: minV ?? 0
    });
    if (this.minV.value < 0) this.minV.value = 0;
  }

  // eslint-disable-next-line class-methods-use-this
  nameDefault(): string {
    return `skidpad solver`;
  }

  preprocess(dt: number, solver: ISolver, value?: number): number {
    if (!isSkidpadSolver(solver)) {
      throw new Error('solverが異なる');
    }
    const reserved = solver.v;
    const deltaDl = dt * this.speed * (this.reverse ? -1 : 1);
    const max = this.maxV.value;
    const min = this.minV.value;
    if (value || value === 0) {
      solver.v = value;
    } else {
      solver.v += deltaDl;
    }
    solver.v = Math.max(max, Math.min(solver.v, min));
    return reserved;
  }

  // eslint-disable-next-line class-methods-use-this
  rollback(value: number, solver: ISolver): void {
    if (!isSkidpadSolver(solver)) {
      throw new Error('solverが異なる');
    }
    solver.v = value;
  }

  getDataControl(): IDataSkidpadSolverControl {
    const data = super.getDataControlBase();
    return {
      ...data,
      className: this.className,
      maxV: this.maxV.getData(),
      minV: this.minV.getData(),
      speed: this.speed,
      reverse: this.reverse
    };
  }
}

export function isSkidpadSolverControl(
  control: Control | undefined | null
): control is SkidpadSolverControl {
  if (!control) return false;
  return control.className === SkidpadSolverControl.className;
}
