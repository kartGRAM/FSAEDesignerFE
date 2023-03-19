import store from '@store/store';
import {
  LinearBushingSingleEnd,
  isLinearBushingSingleEnd
} from '@gd/kinematics/Constraints';
import {KinematicSolver} from '@gd/kinematics/Solver';
import {Control, IDataControl, ControllerTypes} from './IControls';

export interface IDataLinearBushingControl extends IDataControl {
  readonly className: 'LinearBushing';
  readonly reverse: boolean;
  readonly speed: number; // mm/s
}

export function isDataLinearBushingControl(
  control: IDataControl | undefined | null
): control is IDataLinearBushingControl {
  if (!control) return false;
  return control.className === 'LinearBushing';
}

export class LinearBushingControl extends Control {
  readonly className = 'LinearBushing' as const;

  reverse: boolean;

  speed: number; // mm/s

  constructor(
    control:
      | IDataLinearBushingControl
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
