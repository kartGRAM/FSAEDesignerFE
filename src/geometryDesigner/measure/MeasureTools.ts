/* eslint-disable max-classes-per-file */
import {v4 as uuidv4} from 'uuid';
import {Vector3} from 'three';
import {
  getIntersectionLineFromTwoPlanes,
  getClosestPointsOfTwoLines,
  getClosestPointsOfPlaneAndLine
} from '@utils/threeUtils';
import {
  IPoint,
  isPoint,
  ILine,
  isLine,
  IPlane,
  isPlane,
  IDatumManager
} from './IDatumObjects';
import {
  IDataMeasureTool,
  IMeasureTool,
  isDataMeasureTool,
  IPosition,
  IDataPosition,
  isDataPosition,
  IDistance,
  IDataDistance,
  isDataDistance
} from './IMeasureTools';

export abstract class MeasureTool implements IMeasureTool {
  readonly isMeasureTool = true as const;

  abstract get description(): string;

  nodeID: string;

  abstract get className(): string;

  name: string;

  visibility: boolean = true;

  abstract getData(): IDataMeasureTool;

  abstract update(): void;

  constructor(params: {name: string} | IDataMeasureTool) {
    this.nodeID = uuidv4();
    this.name = params.name;
    if (isDataMeasureTool(params)) {
      this.nodeID = params.nodeID;
      this.visibility = params.visibility;
    }
  }

  abstract copy(other: IMeasureTool): void;

  abstract get value(): {[index: string]: number};

  getDataBase(): IDataMeasureTool {
    return {
      isDataMeasureTool: true,
      nodeID: this.nodeID,
      className: this.className,
      name: this.name,
      visibility: this.visibility
    };
  }
}

export class Position extends MeasureTool implements IPosition {
  readonly isPosition = true as const;

  point: IPoint;

  readonly className = 'Position' as const;

  get description(): string {
    return `XYZ-coordinates of point "${this.point.name}"`;
  }

  constructor(
    params: {name: string; point: IPoint} | IDataPosition,
    datumManager: IDatumManager
  ) {
    super(params);
    if (isDataMeasureTool(params) && isDataPosition(params)) {
      const point = datumManager.getDatumObject(params.point);
      if (!point) throw new Error('pointが見つからない');
      if (!isPoint(point)) throw new Error('datumがIPointでない');
      this.point = point;
    } else {
      this.point = params.point;
    }
  }

  getData(): IDataPosition {
    return {
      ...super.getDataBase(),
      className: 'DataPosition',
      isDataPosition: true,
      point: this.point.nodeID
    };
  }

  // eslint-disable-next-line class-methods-use-this
  update(): void {}

  get value(): {[index: string]: number} {
    const {x, y, z} = this.point.getThreePoint();
    return {x, y, z};
  }

  copy(other: Position): void {
    this.point = other.point;
  }
}

export class Distance extends MeasureTool implements IDistance {
  readonly isDistance = true as const;

  lhs: IPoint | ILine | IPlane;

  rhs: IPoint | ILine | IPlane;

  private lhsBuf: Vector3 = new Vector3();

  private rhsBuf: Vector3 = new Vector3();

  getClosestPoints(): [Vector3, Vector3] {
    return [this.lhsBuf.clone(), this.rhsBuf.clone()];
  }

  readonly className = 'Distance' as const;

  get description(): string {
    return `distance between "${this.lhs.name} & ${this.rhs.name}`;
  }

  constructor(
    params:
      | {
          name: string;
          lhs: IPoint | ILine | IPlane;
          rhs: IPoint | ILine | IPlane;
        }
      | IDataDistance,
    datumManager: IDatumManager
  ) {
    super(params);
    if (isDataMeasureTool(params) && isDataDistance(params)) {
      const iLhs = datumManager.getDatumObject(params.lhs);
      const iRhs = datumManager.getDatumObject(params.rhs);
      if (!iLhs || !iRhs) throw new Error('datumが見つからない');
      if (!isPoint(iLhs) && !isLine(iLhs) && !isPlane(iLhs))
        throw new Error('未対応のデータムを検出');
      if (!isPoint(iRhs) && !isLine(iRhs) && !isPlane(iRhs))
        throw new Error('未対応のデータムを検出');
      this.lhs = iLhs;
      this.rhs = iRhs;
    } else {
      this.lhs = params.lhs;
      this.rhs = params.rhs;
    }
  }

  getData(): IDataDistance {
    return {
      ...super.getDataBase(),
      className: 'DataDistance',
      isDataDistance: true,
      lhs: this.lhs.nodeID,
      rhs: this.rhs.nodeID
    };
  }

  // eslint-disable-next-line class-methods-use-this
  update(): void {
    const {lhs, rhs} = this;
    if (isPlane(lhs)) {
      if (isPlane(rhs)) {
        const planes = [lhs.getThreePlane(), rhs.getThreePlane()];
        const normals = planes.map((p) => p.normal);
        const parallel =
          normals[0].clone().cross(normals[1]).lengthSq() <=
          Number.EPSILON * 2 ** 8;
        if (parallel) {
          [this.lhsBuf, this.rhsBuf] = planes.map((p) =>
            p.normal.multiplyScalar(-p.constant)
          );
        } else {
          const line = getIntersectionLineFromTwoPlanes(planes[0], planes[1]);
          this.lhsBuf = line.closestPointToPoint(
            new Vector3(),
            false,
            new Vector3()
          );
          this.rhsBuf = this.lhsBuf;
        }
      } else if (isLine(rhs)) {
        const {plane, line} = getClosestPointsOfPlaneAndLine(
          lhs.getThreePlane(),
          rhs.getThreeLine()
        );
        this.lhsBuf = plane;
        this.rhsBuf = line;
      } else if (isPoint(rhs)) {
        const plane = lhs.getThreePlane();
        this.rhsBuf = rhs.getThreePoint();
        this.lhsBuf = plane.projectPoint(this.rhsBuf, new Vector3());
      }
    } else if (isLine(lhs)) {
      if (isPlane(rhs)) {
        const {plane, line} = getClosestPointsOfPlaneAndLine(
          rhs.getThreePlane(),
          lhs.getThreeLine()
        );
        this.lhsBuf = line;
        this.rhsBuf = plane;
      } else if (isLine(rhs)) {
        const points = getClosestPointsOfTwoLines(
          lhs.getThreeLine(),
          rhs.getThreeLine()
        );
        this.lhsBuf = points.lhs;
        this.rhsBuf = points.rhs;
      } else if (isPoint(rhs)) {
        this.rhsBuf = rhs.getThreePoint();
        this.lhsBuf = lhs
          .getThreeLine()
          .closestPointToPoint(this.rhsBuf, false, new Vector3());
      }
    } else if (isPoint(lhs)) {
      if (isPlane(rhs)) {
        this.lhsBuf = lhs.getThreePoint();
        const plane = rhs.getThreePlane();
        this.rhsBuf = plane.projectPoint(this.lhsBuf, new Vector3());
      } else if (isLine(rhs)) {
        this.lhsBuf = lhs.getThreePoint();
        this.rhsBuf = rhs
          .getThreeLine()
          .closestPointToPoint(this.lhsBuf, false, new Vector3());
      } else if (isPoint(rhs)) {
        this.lhsBuf = lhs.getThreePoint();
        this.rhsBuf = rhs.getThreePoint();
      }
    }
  }

  get value(): {[index: string]: number} {
    const distance = this.lhsBuf.clone().sub(this.rhsBuf).length();
    return {_: distance};
  }

  copy(other: Distance): void {
    this.lhs = other.lhs;
    this.rhs = other.rhs;
  }
}

export function getMeasureTool(
  tool: IDataMeasureTool,
  datumManager: IDatumManager
) {
  if (isDataPosition(tool)) return new Position(tool, datumManager);
  throw new Error('未実装のツール');
}
