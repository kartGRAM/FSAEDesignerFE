import store from '@store/store';
import {
  IDataVector3,
  INamedVector3,
  FunctionVector3,
  IDataNumber,
  INamedNumber
} from '@gd/INamedValues';
import {PointToPlane, isPointToPlane} from '@gd/kinematics/Constraints';
import {KinematicSolver} from '@gd/kinematics/Solver';
import {NamedVector3, NamedNumber} from '@gd/NamedValues';
import {Control, IDataControl, ControllerTypes} from './IControls';

export const className = 'PointToPlaneControl' as const;
type ClassName = typeof className;

export interface IDataPointToPlaneControl extends IDataControl {
  readonly className: ClassName;
  readonly pointID: string;
  readonly origin: IDataVector3;
  readonly normal: IDataVector3;
  readonly min: IDataNumber;
  readonly max: IDataNumber;
}

export function isDataPointToPlaneControl(
  control: IDataControl | undefined | null
): control is IDataPointToPlaneControl {
  if (!control) return false;
  return control.className === className;
}

export class PointToPlaneControl extends Control {
  readonly className = className;

  pointID: string;

  origin: INamedVector3;

  normal: INamedVector3;

  max: INamedNumber;

  min: INamedNumber;

  constructor(
    control:
      | IDataPointToPlaneControl
      | {
          type: ControllerTypes;
          targetElements: string[];
          inputButton: string;
          nodeID?: string;
          pointID?: string;
          origin?: FunctionVector3 | IDataVector3 | INamedVector3;
          normal?: FunctionVector3 | IDataVector3 | INamedVector3;
          max?: string | number | IDataNumber | INamedNumber;
          min?: string | number | IDataNumber | INamedNumber;
          reverse?: boolean;
        }
  ) {
    super(control);
    const {origin, normal, pointID, max, min} = control;

    this.pointID = pointID ?? '';
    this.max = new NamedNumber({
      name: 'max',
      value: max ?? 10
    });
    this.min = new NamedNumber({
      name: 'min',
      value: min ?? -10
    });

    this.origin = new NamedVector3({
      name: 'origin',
      value: origin ?? {x: 0, y: 0, z: 0}
    });

    this.normal = new NamedVector3({
      name: 'normal',
      value: normal ?? {x: 0, y: 0, z: 1}
    });
  }

  nameDefault(): string {
    const elements = store.getState().uitgd.collectedAssembly?.children;
    const element = elements?.find((e) =>
      this.targetElements.includes(e.nodeID)
    );
    if (!element) return 'component not found';
    const point = element
      .getMeasurablePoints()
      .find((p) => p.nodeID === this.pointID);
    if (!point) return 'target point not found';
    return `position of ${point.name} of ${element.name.value}`;
  }

  preprocess(dt: number, solver: KinematicSolver): number[] {
    const deltaDl = dt * this.speed * (this.reverse ? -1 : 1);
    const roots = solver.components.map((c) => c[0]);
    const constraints = roots.reduce((prev, current) => {
      prev.push(
        ...(current
          .getGroupedConstraints()
          .filter(
            (c) => isPointToPlane(c) && c.controledBy === this.nodeID
          ) as PointToPlane[])
      );
      return prev;
    }, [] as PointToPlane[]);
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
            (c) => isPointToPlane(c) && c.controledBy === this.nodeID
          ) as PointToPlane[])
      );
      return prev;
    }, [] as PointToPlane[]);
    constraints.forEach((constraint, i) => {
      constraint.dl = value[i];
    });
  }

  getDataControl(): IDataPointToPlaneControl {
    const data = super.getDataControlBase();
    const state = store.getState().dgd.present;
    return {
      ...data,
      className: this.className,
      pointID: this.pointID,
      origin: this.origin.getData(state),
      normal: this.normal.getData(state),
      max: this.max.getData(state),
      min: this.min.getData(state),
      speed: this.speed,
      reverse: this.reverse
    };
  }
}

export function isPointToPlaneControl(
  control: Control | undefined | null
): control is PointToPlaneControl {
  if (!control) return false;
  return control.className === className;
}
