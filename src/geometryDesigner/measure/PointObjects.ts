/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  isDataDatumObject,
  IPoint,
  isPoint,
  IDataPoint,
  IDatumObject,
  DatumDict
} from '@gd/measure/IDatumObjects';
import {
  IFixedPoint,
  IDataFixedPoint,
  isFixedPoint,
  isDataFixedPoint,
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

export abstract class Point extends DatumObject implements IPoint {
  abstract get description(): string;

  readonly isPoint = true as const;

  abstract getThreePoint(): Vector3;

  abstract getData(): IDataPoint;

  getDataBase(): IDataPoint {
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

  getThreePoint(): Vector3 {
    return this.position.value;
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
    this.position = new NamedVector3({value: {...position}});
    if (isDataDatumObject(params) && isDataFixedPoint(params)) {
      this.position = new NamedVector3(params.position);
    }
  }

  copy(other: IDatumObject): void {
    if (isPoint(other) && isFixedPoint(other)) {
      this.position.value = other.position.value;
    } else {
      throw new Error('型不一致');
    }
  }
}

export class ElementPoint extends Point implements IElementPoint {
  readonly className = 'ElementPoint' as const;

  element: string;

  point: string;

  storedValue: Vector3;

  elementBuf: IElement | undefined = undefined;

  get description() {
    const element = this.elementBuf;
    return `element point of ${element?.name.value}`;
  }

  getThreePoint(): Vector3 {
    return this.storedValue.clone();
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
    this.storedValue = new Vector3();
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
