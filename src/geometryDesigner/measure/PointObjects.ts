/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  isDataDatumObject,
  IPoint,
  ILine,
  IPlane,
  isPoint,
  isLine,
  isPlane,
  IDataPoint,
  IDatumObject,
  DatumDict
} from '@gd/measure/IDatumObjects';
import {
  IFixedPoint,
  IDataFixedPoint,
  isFixedPoint,
  isDataFixedPoint,
  IPlaneLineIntersection,
  IDataPlaneLineIntersection,
  isPlaneLineIntersection,
  isDataPlaneLineIntersection,
  IDataElementPoint,
  IElementPoint,
  isElementPoint,
  isDataElementPoint
} from '@gd/measure/IPointObjects';
import {Vector3} from 'three';
import {DatumObject} from '@gd/measure/DatumObjects';
import {IAssembly, IElement} from '@gd/IElements';
import {INamedVector3} from '@gd/INamedValues';
import {NamedVector3} from '@gd/NamedValues';
import store from '@store/store';
import {getIntersectionOfPlaneAndLine} from '@utils/threeUtils';

export abstract class Point extends DatumObject implements IPoint {
  abstract get description(): string;

  readonly isPoint = true as const;

  protected storedValue: Vector3 = new Vector3();

  getThreePoint(): Vector3 {
    return this.storedValue.clone();
  }

  abstract getData(): IDataPoint;

  protected getDataBase(): IDataPoint {
    const base = super.getDataBase();
    const {x, y, z} = this.getThreePoint();
    return {
      ...base,
      isDataPoint: true,
      lastPosition: {x, y, z}
    };
  }
}

export class FixedPoint extends Point implements IFixedPoint {
  readonly className = 'FixedPoint' as const;

  position: INamedVector3;

  // eslint-disable-next-line class-methods-use-this
  get description() {
    return `fixed point`;
  }

  getData(): IDataFixedPoint {
    const base = super.getDataBase();
    const state = store.getState().dgd.present;
    return {
      ...base,
      className: this.className,
      position: this.position.getData(state)
    };
  }

  getThreePoint(): Vector3 {
    return this.position.value.clone();
  }

  // eslint-disable-next-line class-methods-use-this
  update(): void {}

  constructor(
    params:
      | {
          name: string;
          position: {
            x: number | string;
            y: number | string;
            z: number | string;
          };
          nodeID?: string;
        }
      | IDataFixedPoint
  ) {
    super(params);
    const {position, nodeID} = params;
    this.position = new NamedVector3({value: position});
  }

  copy(other: IDatumObject): void {
    if (isPoint(other) && isFixedPoint(other)) {
      this.position.setValue(other.position.getStringValue());
    } else {
      throw new Error('型不一致');
    }
  }
}

export class ElementPoint extends Point implements IElementPoint {
  readonly className = 'ElementPoint' as const;

  element: string;

  point: string;

  elementBuf: IElement | undefined = undefined;

  get description() {
    const element = this.elementBuf;
    return `element point of ${element?.name.value}`;
  }

  getData(): IDataElementPoint {
    const base = super.getDataBase();
    return {
      ...base,
      className: this.className,
      element: this.element,
      point: this.point
    };
  }

  update(ref: DatumDict, collectedAssembly: IAssembly): void {
    this.elementBuf = collectedAssembly.children.find(
      (child) => child.nodeID === this.element
    );
    if (!this.elementBuf) throw new Error('ｺﾝﾎﾟｰﾈﾝﾄが見つからない');
    const point = this.elementBuf
      .getMeasurablePoints()
      .find((p) => p.nodeID === this.point);
    if (!point) throw new Error('計測点が見つからない');
    this.storedValue = point.value
      .applyQuaternion(this.elementBuf.rotation.value)
      .add(this.elementBuf.position.value);
  }

  constructor(
    params: {name: string; element: string; point: string} | IDataElementPoint
  ) {
    super(params);
    this.element = params.element;
    this.point = params.point;
    if (isDataDatumObject(params) && isDataElementPoint(params)) {
      this.storedValue = new Vector3(...Object.values(params.lastPosition));
    }
  }

  copy(other: IDatumObject): void {
    if (isPoint(other) && isElementPoint(other)) {
      this.element = other.element;
      this.point = other.point;
    } else {
      throw new Error('型不一致');
    }
  }
}

export class PlaneLineIntersection
  extends Point
  implements IPlaneLineIntersection
{
  readonly className = 'PlaneLineIntersection' as const;

  plane: string;

  line: string;

  planeBuf: IPlane | undefined = undefined;

  lineBuf: ILine | undefined = undefined;

  // eslint-disable-next-line class-methods-use-this
  get description() {
    return `intersection point of line and plane`;
  }

  getData(): IDataPlaneLineIntersection {
    const base = super.getDataBase();
    return {
      ...base,
      className: this.className,
      plane: this.plane,
      line: this.line
    };
  }

  update(ref: DatumDict): void {
    const plane = ref[this.plane];
    if (!plane || !isPlane(plane))
      throw new Error('データム平面が見つからない');
    const line = ref[this.line];
    if (!line || !isLine(line)) throw new Error('データム軸が見つからない');
    this.planeBuf = plane;
    this.lineBuf = line;
    // plane.normal.normalize();
    this.storedValue = getIntersectionOfPlaneAndLine(
      plane.getThreePlane(),
      line.getThreeLine()
    );
  }

  constructor(
    params:
      | {name: string; plane: string; line: string}
      | IDataPlaneLineIntersection
  ) {
    super(params);
    this.plane = params.plane;
    this.line = params.line;
    if (isDataDatumObject(params) && isDataPlaneLineIntersection(params)) {
      this.storedValue = new Vector3(...Object.values(params.lastPosition));
    }
  }

  copy(other: IDatumObject): void {
    if (isPoint(other) && isPlaneLineIntersection(other)) {
      this.plane = other.plane;
      this.line = other.line;
    } else {
      throw new Error('型不一致');
    }
  }
}
