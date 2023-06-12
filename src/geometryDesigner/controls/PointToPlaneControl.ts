import store from '@store/store';
import {IDataVector3, INamedVector3, FunctionVector3} from '@gd/INamedValues';
import {PointToPlane, isPointToPlane} from '@gd/kinematics/Constraints';
import {KinematicSolver} from '@gd/kinematics/Solver';
import {NamedVector3} from '@gd/NamedValues';
import {Control, IDataControl, ControllerTypes} from './IControls';

export const className = 'PointToPlaneControl' as const;
type ClassName = typeof className;

export interface IDataPointToPlaneControl extends IDataControl {
  readonly className: ClassName;
  readonly pointID: string;
  readonly origin: IDataVector3;
  readonly normal: IDataVector3;
  readonly reverse: boolean;
  readonly speed: number; // mm/s
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

  reverse: boolean;

  speed: number; // mm/s

  origin: NamedVector3;

  normal: NamedVector3;

  constructor(
    control:
      | IDataPointToPlaneControl
      | {
          type: ControllerTypes;
          targetElement: string;
          inputButton: string;
          nodeID?: string;
          pointID?: string;
          origin?: FunctionVector3 | IDataVector3 | INamedVector3;
          normal?: FunctionVector3 | IDataVector3 | INamedVector3;
          speed?: number;
          reverse?: boolean;
        }
  ) {
    super(control);
    const {origin, normal, pointID} = control;
    this.speed = control.speed ?? 10;
    this.reverse = control.reverse ?? false;

    this.pointID = pointID ?? '';

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
    const element = elements?.find((e) => e.nodeID === this.targetElement);
    if (!element) return 'component not found';
    const point = element.getPoints().find((p) => p.nodeID === this.pointID);
    if (!point) return 'target point not found';
    return `position of ${point.name} of ${element.name.value}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  preprocess(dt: number, solver: KinematicSolver): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const deltaDl = dt * this.speed * (this.reverse ? -1 : 1);
    const roots = solver.components.map((c) => c[0]);
    const constraints = roots.reduce((prev, current) => {
      prev.push(
        ...(current
          .getGroupedConstraints()
          .filter(
            (c) => isPointToPlane(c) && c.elementID === this.targetElement
          ) as PointToPlane[])
      );
      return prev;
    }, [] as PointToPlane[]);
    constraints.forEach((constraint) => {
      constraint.dl += deltaDl;
      constraint.dl = Math.min(
        constraint.dlMax,
        Math.max(constraint.dlMin, constraint.dl)
      );
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
