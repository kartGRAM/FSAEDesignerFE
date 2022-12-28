/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  isDataDatumObject,
  IPlane,
  isPlane,
  IPoint,
  isPoint,
  IDataPlane,
  IDatumObject,
  DatumDict
} from '@gd/measure/IDatumObjects';
import {
  IThreePointsPlane,
  isThreePointsPlane,
  IDataThreePointsPlane,
  isDataThreePointsPlane
} from '@gd/measure/IPlaneObjects';
import {Vector3, Plane as ThreePlane, Vector} from 'three';
import {DatumObject} from '@gd/measure/DatumObjects';
import {IAssembly, IElement} from '@gd/IElements';

export abstract class Plane extends DatumObject implements IPlane {
  abstract get planeCenter(): Vector3;

  abstract get planeSize(): {width: number; height: number};

  readonly isPlane = true as const;

  abstract get description(): string;

  abstract getThreePlane(): ThreePlane;

  abstract getData(): IDataPlane;

  getDataBase(): IDataPlane {
    const base = super.getDataBase();
    const plane = this.getThreePlane();
    const {x, y, z} = plane.normal;
    const {constant} = plane;
    return {
      ...base,
      isDataPlane: true,
      lastPosition: {
        normal: {x, y, z},
        constant
      }
    };
  }
}

export class ThreePointsPlane extends Plane implements IThreePointsPlane {
  readonly className = 'ThreePointsPlane' as const;

  get planeCenter(): Vector3 {
    const points = this.pointsBuf;
    if (!points) return new Vector3();
    const v = new Vector3();
    points.forEach((p) => v.add(p.getThreePoint()));
    v.multiplyScalar(1 / 3);
    return v;
  }

  get planeSize(): {width: number; height: number} {
    return {width: 300, height: 300};
  }

  points: [string, string, string];

  storedValue: ThreePlane;

  pointsBuf: [IPoint, IPoint, IPoint] | undefined;

  get description() {
    return `plane from three points`;
  }

  getThreePlane(): ThreePlane {
    return this.storedValue.clone();
  }

  getData(): IDataThreePointsPlane {
    const base = super.getDataBase();
    return {
      ...base,
      className: this.className,
      points: [...this.points]
    };
  }

  update(ref: DatumDict): void {
    const points = this.points.map((p) => {
      const point = ref[p];
      if (!point || !isPoint(point)) throw new Error('計測点が見つからない');
      return point;
    });
    this.pointsBuf = [points[0], points[1], points[2]];
    this.storedValue = this.storedValue.setFromCoplanarPoints(
      points[0].getThreePoint(),
      points[1].getThreePoint(),
      points[2].getThreePoint()
    );
  }

  constructor(
    params:
      | {name: string; points: [string, string, string]}
      | IDataThreePointsPlane
  ) {
    super(params);
    this.storedValue = new ThreePlane();
    this.points = [...params.points];
    if (isDataDatumObject(params) && isDataThreePointsPlane(params)) {
      const {lastPosition} = params;
      const {x, y, z} = lastPosition.normal;
      this.storedValue = new ThreePlane(
        new Vector3(x, y, z),
        lastPosition.constant
      );
    }
  }

  copy(other: IDatumObject): void {
    if (isPlane(other) && isThreePointsPlane(other)) {
      this.points = [...other.points];
    } else {
      throw new Error('型不一致');
    }
  }
}
