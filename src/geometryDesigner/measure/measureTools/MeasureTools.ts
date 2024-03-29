/* eslint-disable max-classes-per-file */
import {v4 as uuidv4} from 'uuid';
import {Vector3} from 'three';
import {
  getIntersectionLineFromTwoPlanes,
  getClosestPointsOfTwoLines,
  getClosestPointsOfPlaneAndLine
} from '@utils/threeUtils';
import {IMovingElement} from '@gd/IElements';
import {
  IPoint,
  isPoint,
  ILine,
  isLine,
  IPlane,
  isPlane,
  IDatumManager
} from '../datum/IDatumObjects';
import {
  IDataMeasureTool,
  IMeasureTool,
  isDataMeasureTool,
  IPosition,
  IDataPosition,
  isDataPosition,
  IDistance,
  IDataDistance,
  isDataDistance,
  IAngle,
  IDataAngle,
  isDataAngle,
  IMovingElementCurrentPosition,
  IDataMovingElementCurrentPosition,
  isDataMovingElementCurrentPosition
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

  abstract clone(): IMeasureTool;

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
    datumManager?: IDatumManager
  ) {
    super(params);
    if (isDataMeasureTool(params) && isDataPosition(params)) {
      if (datumManager) {
        const point = datumManager.getDatumObject(params.point);
        if (!point) throw new Error('pointが見つからない');
        if (!isPoint(point)) throw new Error('datumがIPointでない');
        this.point = point;
      } else {
        throw new Error('dataPosition使用時はdatumManagerが必要');
      }
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

  clone(): IPosition {
    return new Position(this);
  }

  copy(other: Position): void {
    this.name = other.name;
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
    datumManager?: IDatumManager
  ) {
    super(params);
    if (isDataMeasureTool(params) && isDataDistance(params)) {
      if (datumManager) {
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
        throw new Error('data使用時はdatumManagerが必要');
      }
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

  clone(): IDistance {
    return new Distance(this);
  }

  copy(other: Distance): void {
    this.name = other.name;
    this.lhs = other.lhs;
    this.rhs = other.rhs;
  }
}

export class Angle extends MeasureTool implements IAngle {
  readonly isAngle = true as const;

  lhs: ILine | IPlane;

  rhs: ILine | IPlane;

  private angleBuf: number = 0;

  readonly className = 'Angle' as const;

  get description(): string {
    return `angle between "${this.lhs.name} & ${this.rhs.name}`;
  }

  constructor(
    params:
      | {
          name: string;
          lhs: ILine | IPlane;
          rhs: ILine | IPlane;
        }
      | IDataAngle,
    datumManager?: IDatumManager
  ) {
    super(params);
    if (isDataMeasureTool(params) && isDataAngle(params)) {
      if (datumManager) {
        const iLhs = datumManager.getDatumObject(params.lhs);
        const iRhs = datumManager.getDatumObject(params.rhs);
        if (!iLhs || !iRhs) throw new Error('datumが見つからない');
        if (!isLine(iLhs) && !isPlane(iLhs))
          throw new Error('未対応のデータムを検出');
        if (!isLine(iRhs) && !isPlane(iRhs))
          throw new Error('未対応のデータムを検出');
        this.lhs = iLhs;
        this.rhs = iRhs;
      } else {
        throw new Error('data使用時はdatumManagerが必要');
      }
    } else {
      this.lhs = params.lhs;
      this.rhs = params.rhs;
    }
  }

  getData(): IDataAngle {
    return {
      ...super.getDataBase(),
      className: 'DataAngle',
      isDataAngle: true,
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
          this.angleBuf = 0;
        } else {
          // 法線同士の角度
          const nlhs = lhs.getThreePlane().normal;
          const nrhs = rhs.getThreePlane().normal;
          const angle = Math.acos(nlhs.dot(nrhs));
          this.angleBuf = (angle * 180) / Math.PI;
        }
      } else if (isLine(rhs)) {
        const line = rhs.getThreeLine().delta(new Vector3()).normalize();
        const {normal} = lhs.getThreePlane();
        const dot = line.dot(normal);
        this.angleBuf = 90 - (Math.acos(Math.abs(dot)) * 180) / Math.PI;
      }
    } else if (isLine(lhs)) {
      if (isPlane(rhs)) {
        const line = lhs.getThreeLine().delta(new Vector3()).normalize();
        const {normal} = rhs.getThreePlane();
        const dot = line.dot(normal);
        this.angleBuf = 90 - (Math.acos(Math.abs(dot)) * 180) / Math.PI;
      } else if (isLine(rhs)) {
        const nlhs = lhs.getThreeLine().delta(new Vector3());
        const nrhs = rhs.getThreeLine().delta(new Vector3());
        this.angleBuf = (nlhs.angleTo(nrhs) * 180) / Math.PI;
      }
    }
  }

  get value(): {[index: string]: number} {
    return {_: this.angleBuf};
  }

  clone(): IAngle {
    return new Angle(this);
  }

  copy(other: Angle): void {
    this.name = other.name;
    this.lhs = other.lhs;
    this.rhs = other.rhs;
  }
}

export class MovingElementCurrentPosition
  extends MeasureTool
  implements IMovingElementCurrentPosition
{
  readonly isMovingElementCurrentPosition = true as const;

  element: IMovingElement | undefined;

  private currentBuf: number = 0;

  readonly className = 'MovingElementCurrentPosition' as const;

  get description(): string {
    return `current value of "${this.element?.name.value ?? 'unknown'}"`;
  }

  constructor(
    params:
      | {
          name: string;
          element: IMovingElement | undefined;
        }
      | IDataMovingElementCurrentPosition,
    elements?: IMovingElement[]
  ) {
    super(params);
    if (
      isDataMeasureTool(params) &&
      isDataMovingElementCurrentPosition(params)
    ) {
      if (elements) {
        this.element = elements.find((e) => e.nodeID === params.element);
      } else {
        throw new Error('data使用時はelementsが必要');
      }
    } else {
      this.element = params.element;
    }
  }

  getData(): IDataMovingElementCurrentPosition {
    return {
      ...super.getDataBase(),
      className: 'DataMovingElementCurrentPosition',
      isDataMovingElementCurrentPosition: true,
      element: this.element?.nodeID ?? ''
    };
  }

  // eslint-disable-next-line class-methods-use-this
  update(): void {
    this.currentBuf = this.element?.dlCurrent ?? Number.NaN;
  }

  get value(): {[index: string]: number} {
    return {_: this.currentBuf};
  }

  clone(): IMovingElementCurrentPosition {
    return new MovingElementCurrentPosition(this);
  }

  copy(other: IMovingElementCurrentPosition): void {
    this.element = other.element;
    this.name = other.name;
  }
}

export function getMeasureTool(
  tool: IDataMeasureTool,
  datumManager: IDatumManager,
  elements: IMovingElement[]
) {
  if (isDataPosition(tool)) return new Position(tool, datumManager);
  if (isDataDistance(tool)) return new Distance(tool, datumManager);
  if (isDataAngle(tool)) return new Angle(tool, datumManager);
  if (isDataMovingElementCurrentPosition(tool))
    return new MovingElementCurrentPosition(tool, elements);
  throw new Error('未実装のツール');
}
