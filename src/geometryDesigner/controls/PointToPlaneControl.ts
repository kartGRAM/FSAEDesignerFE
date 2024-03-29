import {
  IDataVector3,
  INamedVector3,
  FunctionVector3,
  IDataNumber,
  INamedNumber
} from '@gd/INamedValues';
import {
  PointToPlane,
  isPointToPlane
} from '@gd/kinematics/KinematicConstraints';
import {ISolver} from '@gd/kinematics/ISolver';
import {NamedVector3, NamedNumber} from '@gd/NamedValues';
import {getDataElementByID} from '@gd/IElements';
import {getElement} from '@gd/Elements';
import {getDgd} from '@store/getDgd';
import {Control, IDataControl, ControllerTypes} from './IControls';

export interface IDataPointToPlaneControl extends IDataControl {
  readonly className: typeof PointToPlaneControl.className;
  readonly pointIDs: {[index: string]: string[]};
  readonly origin: IDataVector3;
  readonly normal: IDataVector3;
  readonly min: IDataNumber;
  readonly max: IDataNumber;
}

export function isDataPointToPlaneControl(
  control: IDataControl | undefined | null
): control is IDataPointToPlaneControl {
  if (!control) return false;
  return control.className === PointToPlaneControl.className;
}

export class PointToPlaneControl extends Control {
  static className = 'PointToPlaneControl' as const;

  readonly className = PointToPlaneControl.className;

  pointIDs: {[index: string]: string[]};

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
          pointIDs?: {[index: string]: string[]};
          origin?: FunctionVector3 | IDataVector3 | INamedVector3;
          normal?: FunctionVector3 | IDataVector3 | INamedVector3;
          max?: string | number | IDataNumber | INamedNumber;
          min?: string | number | IDataNumber | INamedNumber;
          reverse?: boolean;
        }
  ) {
    super(control);
    const {origin, normal, pointIDs, max, min} = control;
    this.pointIDs = pointIDs ?? {};
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
    const target = this.targetElements[0] ?? 'not found';
    const dataElement = getDataElementByID(getDgd().topAssembly, target);
    if (!dataElement) return 'component not found';
    const element = getElement(dataElement);
    const point = element
      .getMeasurablePoints()
      .find((p) => this.pointIDs[element.nodeID].includes(p.nodeID));
    if (!point) return 'target point not found';
    return `position of ${point.name} of ${element.name.value}`;
  }

  preprocess(dt: number, solver: ISolver, value?: number): number[] {
    const deltaDl = dt * this.speed * (this.reverse ? -1 : 1);
    const roots = solver.components.map((c) => c[0]);
    const constraints = roots.reduce((prev, current) => {
      prev.push(
        ...(current
          .getGroupedConstraints()
          .filter(
            (c) => isPointToPlane(c) && c.controledBy.includes(this.nodeID)
          ) as PointToPlane[])
      );
      return prev;
    }, [] as PointToPlane[]);
    const reserved: number[] = [];
    constraints.forEach((constraint) => {
      reserved.push(constraint.dl);
      if (value || value === 0) {
        constraint.dl = value;
      } else {
        constraint.dl += deltaDl;
      }
    });
    return reserved;
  }

  rollback(value: number[], solver: ISolver): void {
    const roots = solver.components.map((c) => c[0]);
    const constraints = roots.reduce((prev, current) => {
      prev.push(
        ...(current
          .getGroupedConstraints()
          .filter(
            (c) => isPointToPlane(c) && c.controledBy.includes(this.nodeID)
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
    return {
      ...data,
      className: this.className,
      pointIDs: this.pointIDs,
      origin: this.origin.getData(),
      normal: this.normal.getData(),
      max: this.max.getData(),
      min: this.min.getData(),
      speed: this.speed,
      reverse: this.reverse
    };
  }
}

export function isPointToPlaneControl(
  control: Control | undefined | null
): control is PointToPlaneControl {
  if (!control) return false;
  return control.className === PointToPlaneControl.className;
}
