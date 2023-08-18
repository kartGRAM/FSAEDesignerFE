import {
  LinearBushingSingleEnd,
  isLinearBushingSingleEnd
} from '@gd/kinematics/Constraints';
import {KinematicSolver} from '@gd/kinematics/Solver';
import {getDataElementByID} from '@gd/IElements';
import {getDgd} from '@store/getDgd';
import {getElement} from '@gd/Elements';
import {Control, IDataControl, ControllerTypes} from './IControls';

export interface IDataLinearBushingControl extends IDataControl {
  readonly className: 'LinearBushing';
}

export function isDataLinearBushingControl(
  control: IDataControl | undefined | null
): control is IDataLinearBushingControl {
  if (!control) return false;
  return control.className === 'LinearBushing';
}

export class LinearBushingControl extends Control {
  readonly className = 'LinearBushing' as const;

  constructor(
    control:
      | IDataLinearBushingControl
      | {
          type: ControllerTypes;
          targetElements: [string];
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
    const target = this.targetElements[0] ?? 'not found';
    const dataElement = getDataElementByID(getDgd().topAssembly, target);
    if (!dataElement) return 'component not found';
    const element = getElement(dataElement);
    return `position of ${element.name.value}`;
  }

  preprocess(dt: number, solver: KinematicSolver, value?: number): number[] {
    const deltaDl = dt * this.speed * (this.reverse ? -1 : 1);
    const roots = solver.components.map((c) => c[0]);
    const constraints = roots.reduce((prev, current) => {
      prev.push(
        ...(current
          .getGroupedConstraints()
          .filter(
            (c) =>
              isLinearBushingSingleEnd(c) && c.controledBy.includes(this.nodeID)
          ) as LinearBushingSingleEnd[])
      );
      return prev;
    }, [] as LinearBushingSingleEnd[]);
    const reserved: number[] = [];
    constraints.forEach((constraint) => {
      reserved.push(constraint.dl);
      if (value || value === 0) {
        constraint.dl = value;
      } else {
        constraint.dl += deltaDl;
      }
      constraint.dl = Math.min(
        constraint.dlMax,
        Math.max(constraint.dlMin, constraint.dl)
      );
    });
    return reserved;
  }

  rollback(data: number[], solver: KinematicSolver): void {
    const roots = solver.components.map((c) => c[0]);
    const constraints = roots.reduce((prev, current) => {
      prev.push(
        ...(current
          .getGroupedConstraints()
          .filter(
            (c) =>
              isLinearBushingSingleEnd(c) && c.controledBy.includes(this.nodeID)
          ) as LinearBushingSingleEnd[])
      );
      return prev;
    }, [] as LinearBushingSingleEnd[]);
    constraints.forEach((constraint, i) => {
      constraint.dl = data[i];
    });
  }

  getDataControl(): IDataLinearBushingControl {
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
