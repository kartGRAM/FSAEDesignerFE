import store from '@store/store';
import {BarAndSpheres, isBarAndSpheres} from '@gd/kinematics/Constraints';
import {KinematicSolver} from '@gd/kinematics/Solver';
import {Control, IDataControl, ControllerTypes} from './IControls';

const className = 'DistanceControl' as const;
type ClassName = typeof className;

export interface IDataDistanceControl extends IDataControl {
  readonly className: ClassName;
}

export function isDataDistanceControl(
  control: IDataControl | undefined | null
): control is IDataDistanceControl {
  if (!control) return false;
  return control.className === className;
}

export class DistanceControl extends Control {
  readonly className = className;

  reverse: boolean;

  speed: number; // mm/s

  constructor(
    control:
      | IDataDistanceControl
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

  preprocess(dt: number, solver: KinematicSolver): number {
    const deltaDl = dt * this.speed * (this.reverse ? -1 : 1);
    const roots = solver.components.map((c) => c[0]);
    const constraints = roots.reduce((prev, current) => {
      prev.push(
        ...(current
          .getGroupedConstraints()
          .filter(
            (c) => isBarAndSpheres(c) && c.elementID === this.targetElement
          ) as BarAndSpheres[])
      );
      return prev;
    }, [] as BarAndSpheres[]);
    constraints.forEach((constraint) => {
      constraint.dl += deltaDl;
    });
    return deltaDl;
  }

  rollback(value: number, solver: KinematicSolver) {
    const roots = solver.components.map((c) => c[0]);
    const constraints = roots.reduce((prev, current) => {
      prev.push(
        ...(current
          .getGroupedConstraints()
          .filter(
            (c) => isBarAndSpheres(c) && c.elementID === this.targetElement
          ) as BarAndSpheres[])
      );
      return prev;
    }, [] as BarAndSpheres[]);
    constraints.forEach((constraint) => {
      constraint.dl -= value;
    });
  }

  getDataControl(): IDataDistanceControl {
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
): control is DistanceControl {
  if (!control) return false;
  return control.className === className;
}
