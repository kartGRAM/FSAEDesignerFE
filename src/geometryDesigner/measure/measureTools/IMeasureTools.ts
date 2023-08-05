/* eslint-disable @typescript-eslint/no-unused-vars */
import {Vector3} from 'three';
import {MeasureSnapshot} from '@gd/analysis/ISnapshot';
import {NodeID, IPoint, ILine, IPlane} from '../datum/IDatumObjects';

export interface IMeasureTool {
  isMeasureTool: true;
  readonly nodeID: string;
  readonly className: string;
  name: string;
  visibility: boolean;
  getData(): IDataMeasureTool;
  update(): void;
  readonly value: {[index: string]: number};
  copy(other: IMeasureTool): void;
  readonly description: string;
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
  getValuesAll(): MeasureSnapshot;
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
  getClosestPoints(): [Vector3, Vector3];
}

export function isDistance(tool: IMeasureTool | undefined): tool is IDistance {
  if (tool && (tool as IDistance).isDistance) return true;
  return false;
}

export interface IDataDistance extends IDataMeasureTool {
  isDataDistance: true;
  lhs: NodeID;
  rhs: NodeID;
}

export function isDataDistance(data: IDataMeasureTool): data is IDataDistance {
  if ((data as IDataDistance).isDataDistance) return true;
  return false;
}

export interface IAngle extends IMeasureTool {
  isAngle: true;
  lhs: ILine | IPlane;
  rhs: ILine | IPlane;
}

export function isAngle(tool: IMeasureTool | undefined): tool is IAngle {
  if (tool && (tool as IAngle).isAngle) return true;
  return false;
}

export interface IDataAngle extends IDataMeasureTool {
  isDataAngle: true;
  lhs: NodeID;
  rhs: NodeID;
}

export function isDataAngle(data: IDataMeasureTool): data is IDataAngle {
  if ((data as IDataAngle).isDataAngle) return true;
  return false;
}

export interface IPosition extends IMeasureTool {
  isPosition: true;
  point: IPoint;
}

export function isPosition(tool: IMeasureTool | undefined): tool is IPosition {
  if (tool && (tool as IPosition).isPosition) return true;
  return false;
}

export interface IDataPosition extends IDataMeasureTool {
  isDataPosition: true;
  point: NodeID;
}

export function isDataPosition(data: IDataMeasureTool): data is IDataPosition {
  if ((data as IDataPosition).isDataPosition) return true;
  return false;
}
