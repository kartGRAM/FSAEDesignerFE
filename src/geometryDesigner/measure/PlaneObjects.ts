/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  isDataDatumObject,
  IPlane,
  isPlane,
  ILine,
  isLine,
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
  isDataThreePointsPlane,
  IAxisPointPlane,
  isAxisPointPlane,
  IDataAxisPointPlane,
  isDataAxisPointPlane
} from '@gd/measure/IPlaneObjects';
import {Vector3, Plane as ThreePlane, Vector} from 'three';
import {DatumObject} from '@gd/measure/DatumObjects';
import {IAssembly, IElement} from '@gd/IElements';
import {getPlaneFromAxisAndPoint} from '@utils/threeUtils';

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
    const plane = this.storedValue.setFromCoplanarPoints(
      points[0].getThreePoint(),
      points[1].getThreePoint(),
      points[2].getThreePoint()
    );
    // plane.normal.normalize();
    this.storedValue = plane;
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

export class AxisPointPlane extends Plane implements IAxisPointPlane {
  readonly className = 'AxisPointPlane' as const;

  get planeCenter(): Vector3 {
    const point = this.pointBuf?.getThreePoint();
    const line = this.lineBuf?.getThreeLine();
    if (!point || !line) return new Vector3();
    const points = [point, line.start, line.end];
    const v = new Vector3();
    points.forEach((p) => v.add(p));
    v.multiplyScalar(1 / 3);
    return v;
  }

  get planeSize(): {width: number; height: number} {
    return {width: 300, height: 300};
  }

  point: string;

  pointBuf: IPoint | undefined;

  line: string;

  lineBuf: ILine | undefined;

  storedValue: ThreePlane;

  get description() {
    return `plane from three points`;
  }

  getThreePlane(): ThreePlane {
    return this.storedValue.clone();
  }

  getData(): IDataAxisPointPlane {
    const base = super.getDataBase();
    return {
      ...base,
      className: this.className,
      point: this.point,
      line: this.line
    };
  }

  update(ref: DatumDict): void {
    const point = ref[this.point];
    if (!point || !isPoint(point)) throw new Error('計測点が見つからない');
    const line = ref[this.line];
    if (!line || !isLine(line)) throw new Error('データム軸が見つからない');
    this.pointBuf = point;
    this.lineBuf = line;
    // plane.normal.normalize();
    this.storedValue = getPlaneFromAxisAndPoint(
      point.getThreePoint(),
      line.getThreeLine()
    );
  }

  constructor(
    params: {name: string; point: string; line: string} | IDataAxisPointPlane
  ) {
    super(params);
    this.storedValue = new ThreePlane();
    this.point = params.point;
    this.line = params.line;
    if (isDataDatumObject(params) && isDataAxisPointPlane(params)) {
      const {lastPosition} = params;
      const {x, y, z} = lastPosition.normal;
      this.storedValue = new ThreePlane(
        new Vector3(x, y, z),
        lastPosition.constant
      );
    }
  }

  copy(other: IDatumObject): void {
    if (isPlane(other) && isAxisPointPlane(other)) {
      this.point = other.point;
      this.line = other.line;
    } else {
      throw new Error('型不一致');
    }
  }
}
