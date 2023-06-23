import store from '@store/store';
import {
  LinearBushingSingleEnd,
  isLinearBushingSingleEnd
} from '@gd/kinematics/Constraints';
import {KinematicSolver} from '@gd/kinematics/Solver';
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
    const elements = store.getState().uitgd.collectedAssembly?.children;
    const element = elements?.find((e) =>
      this.targetElements.includes(e.nodeID)
    );
    if (!element) return 'component not found';
    return `position of ${element.name.value}`;
  }

  preprocess(dt: number, solver: KinematicSolver): number[] {
    const deltaDl = dt * this.speed * (this.reverse ? -1 : 1);
    const roots = solver.components.map((c) => c[0]);
    const constraints = roots.reduce((prev, current) => {
      prev.push(
        ...(current
          .getGroupedConstraints()
          .filter(
            (c) => isLinearBushingSingleEnd(c) && c.controledBy === this.nodeID
          ) as LinearBushingSingleEnd[])
      );
      return prev;
    }, [] as LinearBushingSingleEnd[]);
    const reserved: number[] = [];
    constraints.forEach((constraint) => {
      reserved.push(constraint.dl);
      constraint.dl += deltaDl;
      constraint.dl = Math.min(
        constraint.dlMax,
        Math.max(constraint.dlMin, constraint.dl)
      );
    });
    return reserved;
  }

  rollback(value: number[], solver: KinematicSolver): void {
    const roots = solver.components.map((c) => c[0]);
    const constraints = roots.reduce((prev, current) => {
      prev.push(
        ...(current
          .getGroupedConstraints()
          .filter(
            (c) => isLinearBushingSingleEnd(c) && c.controledBy === this.nodeID
          ) as LinearBushingSingleEnd[])
      );
      return prev;
    }, [] as LinearBushingSingleEnd[]);
    constraints.forEach((constraint, i) => {
      constraint.dl = value[i];
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
