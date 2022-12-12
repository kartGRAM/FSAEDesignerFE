/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  isDataDatumObject,
  IDatumObject,
  IPoint,
  IDataPoint,
  DatumDict
} from '@gd/measure/IDatumObjects';
import {
  IDataElementPoint,
  IElementPoint,
  isDataElementPoint
} from '@gd/measure/IPointObjects';
import {Vector3} from 'three';
import {DatumObject} from '@gd/measure/DatumObjects';
import store from '@store/store';
import {IAssembly} from '@gd/IElements';

export abstract class Point extends DatumObject implements IPoint {
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

export class ElementPoint extends Point implements IElementPoint {
  readonly className = 'ElementPoint' as const;

  element: string;

  point: string;

  storedValue: Vector3;

  getThreePoint(): Vector3 {
    return this.storedValue;
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
    const element = collectedAssembly.children.find(
      (child) => child.nodeID === this.element
    );
    const point = element
      ?.getMeasurablePoints()
      .find((p) => p.nodeID === this.point);
    if (!point) throw new Error('計測点が見つからない');
    this.storedValue = point.value;
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
}
