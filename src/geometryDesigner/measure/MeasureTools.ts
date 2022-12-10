/* eslint-disable max-classes-per-file */
import {v4 as uuidv4} from 'uuid';
import store from '@store/store';
import {IPoint, isPoint} from './IDatumObjects';
import {
  IDataMeasureTool,
  IMeasureTool,
  isDataMeasureTool,
  IPosition,
  IDataPosition,
  isDataPosition
} from './IMeasureTools';

export abstract class MeasureTool implements IMeasureTool {
  readonly isMeasureTool = true as const;

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
    }
  }

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

  constructor(params: {name: string; point: IPoint} | IDataPosition) {
    super(params);
    if (isDataPosition(params)) {
      const manager = store.getState().uitgd.datumManager!;
      const point = manager.getDatumObject(params.point);
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
}

export function getMeasureTool(tool: IMeasureTool) {
  if (isDataPosition(tool)) return new Position(tool);
  throw new Error('未実装のツール');
}
