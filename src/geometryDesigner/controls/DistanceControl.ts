import {getDgd} from '@store/getDgd';
import {BarAndSpheres, isBarAndSpheres} from '@gd/kinematics/Constraints';
import {ISolver} from '@gd/kinematics/ISolver';
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

  preprocess(dt: number, solver: ISolver, value?: number): {value: number[]} {
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
    if (!value && value !== 0) {
      return {
        value: constraints.map((constraint) => {
          const tmp = constraint.dl;
          constraint.dl += deltaDl;
          return tmp;
        })
      };
    }
    return {
      value: constraints.map((constraint) => {
        const tmp = constraint.dl;
        constraint.dl = value;
        return tmp;
      })
    };
  }

  rollback(data: {value: number[]}, solver: ISolver) {
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
      constraint.dl = data.value[i];
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
