import {getDgd} from '@store/getDgd';
import {BarAndSpheres, isBarAndSpheres} from '@gd/kinematics/Constraints';
import {KinematicSolver} from '@gd/kinematics/Solver';
import {getDataElementByID} from '@gd/IElements';
import {getElement} from '@gd/Elements';
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
          targetElements: string[];
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

  preprocess(
    dt: number,
    solver: KinematicSolver,
    value?: number
  ): {type: 'delta' | 'absolute'; value: number[] | number} {
    const deltaDl = dt * this.speed * (this.reverse ? -1 : 1);
    const roots = solver.components.map((c) => c[0]);
    const constraints = roots.reduce((prev, current) => {
      prev.push(
        ...(current
          .getGroupedConstraints()
          .filter(
            (c) => isBarAndSpheres(c) && c.controledBy.includes(this.nodeID)
          ) as BarAndSpheres[])
      );
      return prev;
    }, [] as BarAndSpheres[]);
    if (!value) {
      constraints.forEach((constraint) => {
        constraint.dl += deltaDl;
      });
      return {type: 'delta', value: deltaDl};
    }
    return {
      type: 'absolute',
      value: constraints.map((constraint) => {
        const tmp = constraint.dl;
        constraint.dl = value;
        return tmp;
      })
    };
  }

  rollback(
    data: {type: 'delta' | 'absolute'; value: number[] | number},
    solver: KinematicSolver
  ) {
    const roots = solver.components.map((c) => c[0]);
    const constraints = roots.reduce((prev, current) => {
      prev.push(
        ...(current
          .getGroupedConstraints()
          .filter(
            (c) => isBarAndSpheres(c) && c.controledBy.includes(this.nodeID)
          ) as BarAndSpheres[])
      );
      return prev;
    }, [] as BarAndSpheres[]);
    constraints.forEach((constraint, i) => {
      if (data.type === 'delta') {
        constraint.dl -= data.value as number;
      } else {
        constraint.dl = (data.value as number[])[i];
      }
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
