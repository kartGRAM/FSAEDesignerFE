/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import {
  isDataDatumObject,
  IPoint,
  isPoint,
  ILine,
  isLine,
  IPlane,
  isPlane,
  IDataLine,
  IDatumObject,
  DatumDict
} from '@gd/measure/datum/IDatumObjects';
import {
  IPointDirectionLine,
  isPointDirectionLine,
  IDataPointDirectionLine,
  isDataPointDirectionLine,
  ITwoPointsLine,
  isTwoPointsLine,
  IDataTwoPointsLine,
  isDataTwoPointsLine,
  ITwoPlaneIntersectionLine,
  isTwoPlaneIntersectionLine,
  IDataTwoPlaneIntersectionLine,
  isDataTwoPlaneIntersectionLine
} from '@gd/measure/datum/ILineObjects';
import {Line3, Vector3} from 'three';
import {DatumObject} from '@gd/measure/datum/DatumObjects';
import {getIntersectionLineFromTwoPlanes} from '@utils/threeUtils';
import {
  FunctionVector3,
  INamedVector3,
  isNamedVector3,
  isNamedData,
  isFunctionVector3
} from '@gd/INamedValues';
import {NamedVector3} from '@gd/NamedValues';

export abstract class Line extends DatumObject implements ILine {
  readonly isLine = true as const;

  abstract get lineStart(): Vector3;

  abstract get lineEnd(): Vector3;

  abstract get description(): string;

  protected storedValue: Line3 = new Line3();

  getThreeLine(): Line3 {
    return this.storedValue.clone();
  }

  abstract getData(): IDataLine;

  protected getDataBase(): IDataLine {
    const base = super.getDataBase();
    const line = this.getThreeLine();
    const {x, y, z} = line.start;
    const {x: ex, y: ey, z: ez} = line.end;
    return {
      ...base,
      isDataLine: true,
      lastPosition: {
        direction: {x: ex - x, y: ey - y, z: ez - z},
        start: {x, y, z}
      }
    };
  }

  protected setLastPosition(params: IDataLine) {
    const lp = params.lastPosition;
    const start = new Vector3(...Object.values(lp.start));
    const direction = new Vector3(...Object.values(lp.direction));
    this.storedValue = new Line3(start, start.clone().add(direction));
  }
}

export class PointDirectionLine extends Line implements IPointDirectionLine {
  get lineStart(): Vector3 {
    return this.storedValue.start.clone();
  }

  get lineEnd(): Vector3 {
    return this.storedValue.end.clone();
  }

  readonly className = 'PointDirectionLine' as const;

  point: string | INamedVector3;

  pointBuf: IPoint | undefined = undefined;

  direction: string | INamedVector3;

  directionBuf: ILine | undefined = undefined;

  get description() {
    return `line of two planes intersection`;
  }

  getData(): IDataPointDirectionLine {
    const base = super.getDataBase();
    return {
      ...base,
      className: this.className,
      point: isNamedVector3(this.point) ? this.point.getData() : this.point,
      direction: isNamedVector3(this.direction)
        ? this.direction.getData()
        : this.direction
    };
  }

  update(ref: DatumDict): void {
    let point: Vector3 | undefined;
    if (isNamedVector3(this.point)) {
      point = this.point.value;
    } else {
      const tmp = ref[this.point];
      if (isPoint(tmp)) point = tmp.getThreePoint();
    }
    if (!point) throw new Error('データム点が見つからない');

    let direction: Vector3 | undefined;
    if (isNamedVector3(this.direction)) {
      direction = this.direction.value;
    } else {
      const tmp = ref[this.direction];
      if (isLine(tmp)) direction = tmp.getThreeLine().delta(new Vector3());
    }
    if (!direction) throw new Error('データム軸が見つからない');
    direction.normalize();

    this.storedValue = new Line3(
      point,
      point.clone().add(direction.clone().multiplyScalar(300))
    );
  }

  constructor(
    params:
      | {
          name: string;
          point: string | INamedVector3 | FunctionVector3;
          direction: string | INamedVector3 | FunctionVector3;
        }
      | IDataPointDirectionLine
  ) {
    super(params);
    const {point, direction} = params;
    this.point =
      isNamedVector3(point) || isNamedData(point) || isFunctionVector3(point)
        ? new NamedVector3({value: point})
        : point;
    this.direction =
      isNamedVector3(direction) ||
      isNamedData(direction) ||
      isFunctionVector3(direction)
        ? new NamedVector3({value: direction})
        : direction;
    if (
      isNamedVector3(this.direction) &&
      this.direction.value.lengthSq() < Number.EPSILON
    ) {
      this.direction.value = new Vector3(1, 0, 0);
    }
    if (isDataDatumObject(params) && isDataPointDirectionLine(params)) {
      this.setLastPosition(params);
    }
  }

  copy(other: IDatumObject): void {
    if (isLine(other) && isPointDirectionLine(other)) {
      if (isNamedVector3(other.point)) {
        this.point = new NamedVector3({value: other.point.getStringValue()});
      } else {
        this.point = other.point;
      }
      if (isNamedVector3(other.direction)) {
        this.direction = new NamedVector3({
          value: other.direction.getStringValue()
        });
      } else {
        this.direction = other.direction;
      }
    } else {
      throw new Error('型不一致');
    }
  }
}

export class TwoPointsLine extends Line implements ITwoPointsLine {
  readonly className = 'TwoPointsLine' as const;

  get lineStart(): Vector3 {
    return this.storedValue.start.clone();
  }

  get lineEnd(): Vector3 {
    return this.storedValue.end.clone();
  }

  points: [string, string];

  pointsBuf: [IPoint, IPoint] | undefined = undefined;

  get description() {
    return `line from two points`;
  }

  getData(): IDataTwoPointsLine {
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
      if (!point || !isPoint(point))
        throw new Error('データム点が見つからない');
      return point;
    });
    this.pointsBuf = [points[0], points[1]];
    const v3 = this.pointsBuf.map((p) => p.getThreePoint());
    this.storedValue = new Line3(v3[0], v3[1]);
  }

  constructor(
    params: {name: string; points: [string, string]} | IDataTwoPointsLine
  ) {
    super(params);
    this.points = [...params.points];
    if (isDataDatumObject(params) && isDataTwoPointsLine(params)) {
      this.setLastPosition(params);
    }
  }

  copy(other: IDatumObject): void {
    if (isLine(other) && isTwoPointsLine(other)) {
      this.points = [...other.points];
    } else {
      throw new Error('型不一致');
    }
  }
}

export class TwoPlaneIntersectionLine
  extends Line
  implements ITwoPlaneIntersectionLine
{
  get lineStart(): Vector3 {
    if (!this.planeBuf) return new Vector3();
    return this.storedValue.start.clone();
  }

  get lineEnd(): Vector3 {
    if (!this.planeBuf) return new Vector3();
    return this.storedValue.end.clone();
  }

  readonly className = 'TwoPlaneIntersectionLine' as const;

  planes: [string, string];

  planeBuf: [IPlane, IPlane] | undefined = undefined;

  get description() {
    return `line of two planes intersection`;
  }

  getData(): IDataTwoPlaneIntersectionLine {
    const base = super.getDataBase();
    return {
      ...base,
      className: this.className,
      planes: [...this.planes]
    };
  }

  update(ref: DatumDict): void {
    const planes = this.planes.map((p) => {
      const plane = ref[p];
      if (!plane || !isPlane(plane)) throw new Error('平面が見つからない');
      return plane;
    });
    this.planeBuf = [planes[0], planes[1]];
    const threePlanes = this.planeBuf.map((p) => p.getThreePlane());
    this.storedValue = getIntersectionLineFromTwoPlanes(
      threePlanes[0],
      threePlanes[1],
      planes[0].planeCenter
    );
  }

  constructor(
    params:
      | {name: string; planes: [string, string]}
      | IDataTwoPlaneIntersectionLine
  ) {
    super(params);
    this.planes = [params.planes[0], params.planes[1]];
    if (isDataDatumObject(params) && isDataTwoPlaneIntersectionLine(params)) {
      this.setLastPosition(params);
    }
  }

  copy(other: IDatumObject): void {
    if (isLine(other) && isTwoPlaneIntersectionLine(other)) {
      this.planes = [...other.planes];
    } else {
      throw new Error('型不一致');
    }
  }
}
