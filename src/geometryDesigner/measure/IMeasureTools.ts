/* eslint-disable @typescript-eslint/no-unused-vars */
import {NodeID, IPoint, ILine, IPlane} from './IDatumObjects';

export interface IMeasureTool {
  isMeasureTool: true;
  readonly nodeID: string;
  readonly className: string;
  name: string;
  visibility: boolean;
  getData(): IDataMeasureTool;
  update(): void;
  readonly value: {[index: string]: number};
}

export interface IDataMeasureTool {
  isDataMeasureTool: true;
  readonly nodeID: string;
  readonly className: string;
  name: string;
  visibility: boolean;
}

export interface IMeasureToolsManager {
  children: IMeasureTool[];
  getMeasureTool(nodeID: string): IMeasureTool | undefined;
  update(): void;
}

export function isDataMeasureTool(data: any): data is IDataMeasureTool {
  try {
    if (data.isDataMeasureTool) return true;
    return false;
  } catch {
    return false;
  }
}

export interface IDistance extends IMeasureTool {
  isDistance: true;
  lhs: IPoint | ILine | IPlane;
  rhs: IPoint | ILine | IPlane;
}

export interface IDataDistance extends IDataMeasureTool {
  isDistance: true;
  lhs: NodeID;
  rhs: NodeID;
}

export interface IAngle extends IMeasureTool {
  isDistance: true;
  lhs: ILine | IPlane;
  rhs: ILine | IPlane;
}

export interface IDataAngle extends IDataMeasureTool {
  isDistance: true;
  lhs: NodeID;
  rhs: NodeID;
}

export interface IPosition extends IMeasureTool {
  isPosition: true;
  point: IPoint;
}

export interface IDataPosition extends IDataMeasureTool {
  isDataPosition: true;
  point: NodeID;
}

export function isDataPosition(data: any): data is IDataPosition {
  try {
    if (data.isDataPosition) return true;
    return false;
  } catch {
    return false;
  }
}
