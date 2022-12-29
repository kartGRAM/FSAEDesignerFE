/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
} from '@gd/measure/IDatumObjects';
import {
  IDataTwoPlaneIntersectionLine,
  ITwoPlaneIntersectionLine,
  isTwoPlaneIntersectionLine,
  isDataTwoPlaneIntersectionLine
} from '@gd/measure/ILineObjects';
import {BufferGeometry, Line3, Material, Vector3} from 'three';
import {DatumObject} from '@gd/measure/DatumObjects';
import {IAssembly, IElement} from '@gd/IElements';
import {getIntersectionLineFromTwoPlanes} from '@utils/threeUtils';

export abstract class Line extends DatumObject implements ILine {
  readonly isLine = true as const;

  abstract get lineStart(): Vector3;

  abstract get lineEnd(): Vector3;

  abstract get description(): string;

  abstract getThreeLine(): Line3;

  abstract getData(): IDataLine;

  getDataBase(): IDataLine {
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

  storedValue: Line3;

  planeBuf: [IPlane, IPlane] | undefined = undefined;

  get description() {
    return `line of two planes intersection`;
  }

  getThreeLine(): Line3 {
    return this.storedValue.clone();
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
      threePlanes[1]
    );
  }

  constructor(
    params:
      | {name: string; planes: [string, string]}
      | IDataTwoPlaneIntersectionLine
  ) {
    super(params);
    this.planes = [params.planes[0], params.planes[1]];
    this.storedValue = new Line3();
    if (isDataDatumObject(params) && isDataTwoPlaneIntersectionLine(params)) {
      const lp = params.lastPosition;
      const start = new Vector3(...Object.values(lp.start));
      const direction = new Vector3(...Object.values(lp.direction));
      this.storedValue = new Line3(start, start.clone().add(direction));
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
