/* eslint-disable class-methods-use-this */
/* eslint-disable no-nested-ternary */
/* eslint-disable max-classes-per-file */
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
} from '@gd/measure/datum/IDatumObjects';
import {
  BasePlane,
  INormalConstantPlane,
  isNormalConstantPlane,
  IDataNormalConstantPlane,
  IFromBasePlane,
  isFromBasePlane,
  IDataFromBasePlane,
  IPointNormalPlane,
  isPointNormalPlane,
  IDataPointNormalPlane,
  IFromElementBasePlane,
  isFromElementBasePlane,
  IDataFromElementBasePlane,
  IThreePointsPlane,
  isThreePointsPlane,
  IDataThreePointsPlane,
  IAxisPointPlane,
  isAxisPointPlane,
  IDataAxisPointPlane,
  isDataAxisPointPlane,
  IAxisPlaneAnglePlane,
  isAxisPlaneAnglePlane,
  IDataAxisPlaneAnglePlane,
  isDataAxisPlaneAnglePlane
} from '@gd/measure/datum/IPlaneObjects';
import {Vector3, Plane as ThreePlane} from 'three';
import {DatumObject} from '@gd/measure/datum/DatumObjects';
import {IAssembly, IElement} from '@gd/IElements';
import {
  getPlaneFromAxisAndPoint,
  getPlaneFromAxisPlaneAngle
} from '@utils/threeUtils';
import {
  FunctionVector3,
  INamedNumber,
  INamedVector3,
  isNamedVector3,
  isNamedData,
  isFunctionVector3
} from '@gd/INamedValues';
import {NamedNumber, NamedVector3} from '@gd/NamedValues';

function getNormalFromBasePlane(direction: BasePlane) {
  if (direction === 'XY') {
    return new Vector3(0, 0, 1);
  }
  if (direction === 'YZ') {
    return new Vector3(1, 0, 0);
  }
  return new Vector3(0, 1, 0);
}

export abstract class Plane extends DatumObject implements IPlane {
  abstract get planeCenter(): Vector3;

  abstract get planeSize(): {width: number; height: number};

  readonly isPlane = true as const;

  abstract get description(): string;

  abstract getData(): IDataPlane;

  protected getDataBase(): IDataPlane {
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

  protected storedValue: ThreePlane = new ThreePlane();

  getThreePlane(): ThreePlane {
    return this.storedValue.clone();
  }

  protected setLastPosition(params: IDataPlane) {
    const {lastPosition} = params;
    const {x, y, z} = lastPosition.normal;
    this.storedValue = new ThreePlane(
      new Vector3(x, y, z),
      lastPosition.constant
    );
  }
}

export class NormalConstantPlane extends Plane implements INormalConstantPlane {
  readonly className = 'NormalConstantPlane' as const;

  get planeCenter(): Vector3 {
    const distance = this.distance.value;
    const {normal} = this.storedValue;
    return normal.clone().multiplyScalar(distance);
  }

  get planeSize(): {width: number; height: number} {
    return {width: 300, height: 300};
  }

  normal: string | INamedVector3;

  normalBuf: ILine | undefined;

  distance: INamedNumber;

  get description() {
    return `plane from normal and constant`;
  }

  getData(): IDataNormalConstantPlane {
    const base = super.getDataBase();

    return {
      ...base,
      className: this.className,
      normal: isNamedVector3(this.normal)
        ? this.normal.getData()
        : (this.normal as string),
      distance: this.distance.getData()
    };
  }

  update(ref: DatumDict): void {
    let normal: Vector3 | undefined;
    if (isNamedVector3(this.normal)) {
      normal = this.normal.value;
    } else {
      const tmp = ref[this.normal];
      if (isLine(tmp)) normal = tmp.getThreeLine().delta(new Vector3());
    }
    if (!normal) throw new Error('データム軸が見つからない');
    normal.normalize();
    const distance = this.distance.value;
    this.storedValue = new ThreePlane(normal, distance);
  }

  constructor(
    params:
      | {
          name: string;
          distance: string | number | INamedNumber;
          normal: string | INamedVector3 | FunctionVector3;
        }
      | IDataNormalConstantPlane
  ) {
    super(params);
    const {distance, normal} = params;
    this.distance = new NamedNumber({value: distance});
    this.normal =
      isNamedVector3(normal) || isNamedData(normal) || isFunctionVector3(normal)
        ? new NamedVector3({value: normal})
        : normal;
    if (
      isNamedVector3(this.normal) &&
      this.normal.value.lengthSq() < Number.EPSILON
    ) {
      this.normal.value = new Vector3(1, 0, 0);
    }
    if (isDataDatumObject(params) && isDataAxisPointPlane(params)) {
      this.setLastPosition(params);
    }
  }

  copy(other: IDatumObject): void {
    if (isPlane(other) && isNormalConstantPlane(other)) {
      if (isNamedVector3(other.normal)) {
        this.normal = new NamedVector3({value: other.normal.getStringValue()});
      } else {
        this.normal = other.normal;
      }
      this.distance.setValue(other.distance.getStringValue());
    } else {
      throw new Error('型不一致');
    }
  }
}

export class FromBasePlane extends Plane implements IFromBasePlane {
  readonly className = 'FromBasePlane' as const;

  get planeCenter(): Vector3 {
    return new Vector3().add(
      this.storedValue.normal.clone().multiplyScalar(this.distance.value)
    );
  }

  get planeSize(): {width: number; height: number} {
    return {width: 300, height: 300};
  }

  direction: BasePlane;

  distance: INamedNumber;

  get description() {
    return `${this.distance.value}mm from ${this.direction} plane`;
  }

  getData(): IDataFromBasePlane {
    const base = super.getDataBase();
    return {
      ...base,
      className: this.className,
      direction: this.direction,
      distance: this.distance.getData()
    };
  }

  update(): void {
    const normal = getNormalFromBasePlane(this.direction);
    this.storedValue = new ThreePlane().setFromNormalAndCoplanarPoint(
      normal,
      new Vector3()
    );
  }

  constructor(
    params:
      | {
          name: string;
          direction: BasePlane;
          distance: string | number;
        }
      | IDataFromBasePlane
  ) {
    super(params);
    this.direction = params.direction;
    this.distance = new NamedNumber({value: params.distance});
    if (isDataDatumObject(params) && isDataAxisPointPlane(params)) {
      this.setLastPosition(params);
    }
  }

  copy(other: IDatumObject): void {
    if (isPlane(other) && isFromBasePlane(other)) {
      this.direction = other.direction;
      this.distance.setValue(other.distance.getStringValue());
    } else {
      throw new Error('型不一致');
    }
  }
}

export class PointNormalPlane extends Plane implements IPointNormalPlane {
  readonly className = 'PointNormalPlane' as const;

  get planeCenter(): Vector3 {
    return this.pointBuf ?? new Vector3();
  }

  get planeSize(): {width: number; height: number} {
    return {width: 300, height: 300};
  }

  point: string;

  pointBuf: Vector3 | undefined = undefined;

  normal: string | INamedVector3;

  normalBuf: Vector3 | undefined = undefined;

  get description() {
    return `plane from normal and point`;
  }

  getThreePlane(): ThreePlane {
    return this.storedValue.clone();
  }

  getData(): IDataPointNormalPlane {
    const base = super.getDataBase();
    return {
      ...base,
      className: this.className,
      point: this.point,
      normal: isNamedVector3(this.normal)
        ? this.normal.getData()
        : (this.normal as string)
    };
  }

  update(ref: DatumDict): void {
    this.pointBuf = undefined;
    const tmp = ref[this.point];
    if (isPoint(tmp)) {
      this.pointBuf = tmp.getThreePoint();
    }
    if (!this.pointBuf) throw new Error('計測点が見つからない');
    this.normalBuf = undefined;
    if (isNamedVector3(this.normal)) {
      this.normalBuf = this.normal.value.normalize();
    } else {
      const tmp = ref[this.normal];
      if (isLine(tmp))
        this.normalBuf = tmp.getThreeLine().delta(new Vector3()).normalize();
    }
    if (!this.normalBuf) throw new Error('データム軸が見つからない');
    this.storedValue = new ThreePlane().setFromNormalAndCoplanarPoint(
      this.normalBuf,
      this.pointBuf
    );
  }

  constructor(
    params:
      | {
          name: string;
          point: string;
          normal: string | INamedVector3 | FunctionVector3;
        }
      | IDataPointNormalPlane
  ) {
    super(params);
    const {point, normal} = params;
    this.point = point;
    this.normal =
      isNamedVector3(normal) || isNamedData(normal) || isFunctionVector3(normal)
        ? new NamedVector3({value: normal})
        : normal;
    if (
      isNamedVector3(this.normal) &&
      this.normal.value.lengthSq() < Number.EPSILON
    ) {
      this.normal.value = new Vector3(1, 0, 0);
    }
    if (isDataDatumObject(params) && isDataAxisPointPlane(params)) {
      this.setLastPosition(params);
    }
  }

  copy(other: IDatumObject): void {
    if (isPlane(other) && isPointNormalPlane(other)) {
      this.point = other.point;
      if (isNamedVector3(other.normal)) {
        this.normal = new NamedVector3({value: other.normal.getStringValue()});
      } else {
        this.normal = other.normal;
      }
    } else {
      throw new Error('型不一致');
    }
  }
}

export class FromElementBasePlane
  extends Plane
  implements IFromElementBasePlane
{
  readonly className = 'FromElementBasePlane' as const;

  get planeCenter(): Vector3 {
    const element = this.elementBuf;
    if (!element) return new Vector3();
    const position = element.position.value;
    const distance = this.distance.value;
    return position.add(
      this.storedValue.normal.clone().multiplyScalar(distance)
    );
  }

  get planeSize(): {width: number; height: number} {
    return {width: 300, height: 300};
  }

  element: string;

  direction: BasePlane;

  distance: INamedNumber;

  elementBuf: IElement | undefined = undefined;

  get description() {
    const element = this.elementBuf;
    return `${this.distance.value}mm from
            ${element?.name.value}'s ${this.direction} plane`;
  }

  getThreePlane(): ThreePlane {
    return this.storedValue.clone();
  }

  getData(): IDataFromElementBasePlane {
    const base = super.getDataBase();
    return {
      ...base,
      className: this.className,
      element: this.element,
      direction: this.direction,
      distance: this.distance.getData()
    };
  }

  update(ref: DatumDict, collectedAssembly: IAssembly): void {
    this.elementBuf = collectedAssembly.children.find(
      (child) => child.nodeID === this.element
    );
    if (!this.elementBuf) throw new Error('ｺﾝﾎﾟｰﾈﾝﾄが見つからない');
    const position = this.elementBuf.position.value;
    const rotation = this.elementBuf.rotation.value;
    const normal = getNormalFromBasePlane(this.direction).applyQuaternion(
      rotation
    );
    this.storedValue = new ThreePlane().setFromNormalAndCoplanarPoint(
      normal,
      position.add(normal.clone().multiplyScalar(this.distance.value))
    );
  }

  constructor(
    params:
      | {
          name: string;
          element: string;
          direction: BasePlane;
          distance: string | number;
        }
      | IDataFromElementBasePlane
  ) {
    super(params);
    this.element = params.element;
    this.direction = params.direction;
    this.distance = new NamedNumber({value: params.distance});
    if (isDataDatumObject(params) && isDataAxisPointPlane(params)) {
      this.setLastPosition(params);
    }
  }

  copy(other: IDatumObject): void {
    if (isPlane(other) && isFromElementBasePlane(other)) {
      this.element = other.element;
      this.direction = other.direction;
      this.distance.setValue(other.distance.getStringValue());
    } else {
      throw new Error('型不一致');
    }
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
    this.points = [...params.points];
    if (isDataDatumObject(params) && isDataAxisPointPlane(params)) {
      this.setLastPosition(params);
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

  get description() {
    return `plane from three points`;
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

  getThreePlane(): ThreePlane {
    return this.storedValue.clone();
  }

  constructor(
    params: {name: string; point: string; line: string} | IDataAxisPointPlane
  ) {
    super(params);
    this.point = params.point;
    this.line = params.line;
    if (isDataDatumObject(params) && isDataAxisPointPlane(params)) {
      this.setLastPosition(params);
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

export class AxisPlaneAnglePlane extends Plane implements IAxisPlaneAnglePlane {
  readonly className = 'AxisPlaneAnglePlane' as const;

  get planeCenter(): Vector3 {
    const point = this.lineBuf?.getThreeLine().start;
    if (!point) return new Vector3();
    return point;
  }

  get planeSize(): {width: number; height: number} {
    return {width: 300, height: 300};
  }

  line: string;

  lineBuf: ILine | undefined;

  plane: string;

  planeBuf: IPlane | undefined;

  angle: INamedNumber;

  get description() {
    return `plane from axis plane angle`;
  }

  getData(): IDataAxisPlaneAnglePlane {
    const base = super.getDataBase();
    return {
      ...base,
      className: this.className,
      line: this.line,
      plane: this.plane,
      angle: this.angle.getData()
    };
  }

  update(ref: DatumDict): void {
    const line = ref[this.line];
    if (!line || !isLine(line)) throw new Error('データム軸が見つからない');
    const plane = ref[this.plane];
    if (!plane || !isPlane(plane)) throw new Error('データム面が見つからない');
    this.planeBuf = plane;
    this.lineBuf = line;
    // plane.normal.normalize();
    this.storedValue = getPlaneFromAxisPlaneAngle(
      line.getThreeLine(),
      plane.getThreePlane().normal,
      this.angle.value
    );
  }

  getThreePlane(): ThreePlane {
    return this.storedValue.clone();
  }

  constructor(
    params:
      | {
          name: string;
          line: string;
          plane: string;
          angle: string | number | INamedNumber;
        }
      | IDataAxisPlaneAnglePlane
  ) {
    super(params);
    this.plane = params.plane;
    this.line = params.line;
    this.angle = new NamedNumber({value: params.angle});
    if (isDataDatumObject(params) && isDataAxisPlaneAnglePlane(params)) {
      this.setLastPosition(params);
    }
  }

  copy(other: IDatumObject): void {
    if (isPlane(other) && isAxisPlaneAnglePlane(other)) {
      this.plane = other.plane;
      this.line = other.line;
      this.angle = other.angle;
    } else {
      throw new Error('型不一致');
    }
  }
}
