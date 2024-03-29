import {
  INamedNumber,
  IDataNumber,
  INamedVector3,
  IDataVector3
} from '@gd/INamedValues';
import {
  IPlane,
  IPoint,
  NodeID,
  IDataPoint,
  IDataDatumObject
} from './IDatumObjects';

export interface IElementPoint extends IPoint {
  className: 'ElementPoint';
  element: NodeID;
  point: NodeID;
  getData(): IDataElementPoint;
}

export function isElementPoint(
  point: IPoint | undefined
): point is IElementPoint {
  if (!point) return false;
  return point.className === 'ElementPoint';
}

export interface IDataElementPoint extends IDataPoint {
  className: 'ElementPoint';
  element: NodeID;
  point: NodeID;
}

export function isDataElementPoint(
  data: IDataDatumObject
): data is IDataElementPoint {
  if (data.className === 'ElementPoint') return true;
  return false;
}

export interface IFixedPoint extends IPoint {
  className: 'FixedPoint';
  position: INamedVector3;
  getData(): IDataFixedPoint;
}

export function isFixedPoint(point: IPoint | undefined): point is IFixedPoint {
  if (!point) return false;
  return point.className === 'FixedPoint';
}

export interface IDataFixedPoint extends IDataPoint {
  className: 'FixedPoint';
  position: IDataVector3;
}

export function isDataFixedPoint(
  data: IDataDatumObject
): data is IDataFixedPoint {
  if (data.className === 'FixedPoint') return true;
  return false;
}

export interface IPlaneLineIntersection extends IPoint {
  className: 'PlaneLineIntersection';
  plane: NodeID;
  line: NodeID;
  getData(): IDataPlaneLineIntersection;
}

export function isPlaneLineIntersection(
  point: IPoint | undefined
): point is IPlaneLineIntersection {
  if (!point) return false;
  return point.className === 'PlaneLineIntersection';
}

export interface IDataPlaneLineIntersection extends IDataPoint {
  className: 'PlaneLineIntersection';
  plane: NodeID;
  line: NodeID;
}

export function isDataPlaneLineIntersection(
  data: IDataDatumObject
): data is IDataPlaneLineIntersection {
  return data.className === 'PlaneLineIntersection';
}

export interface IProjectionPointToPlane extends IPoint {
  className: 'ProjectionPointToPlane';
  plane: IPlane;
  point: IPoint;
  getData(): IDataProjectionPointToPlane;
}

export interface IDataProjectionPointToPlane extends IDataPoint {
  className: 'ProjectionPointToPlane';
  plane: NodeID;
  point: NodeID;
}

export interface IProjectionPointToLine extends IPoint {
  className: 'ProjectionPointToLine';
  plane: IPlane;
  point: IPoint;
  getData(): IDataProjectionPointToLine;
}

export interface IDataProjectionPointToLine extends IDataPoint {
  className: 'ProjectionPointToLine';
  plane: NodeID;
  line: NodeID;
}

export interface IClosestPointOfTwoLines extends IPoint {
  className: 'ClosestPointOfTwoLines';
  lines: [NodeID, NodeID];
  weight: INamedNumber;
  getData(): IDataClosestPointOfTwoLines;
}

export function isClosestPointOfTwoLines(
  point: IPoint | undefined
): point is IClosestPointOfTwoLines {
  if (!point) return false;
  return point.className === 'ClosestPointOfTwoLines';
}

export interface IDataClosestPointOfTwoLines extends IDataPoint {
  className: 'ClosestPointOfTwoLines';
  lines: [NodeID, NodeID];
  weight: IDataNumber;
}

export function isDataClosestPointOfTwoLines(
  data: IDataDatumObject
): data is IDataClosestPointOfTwoLines {
  return data.className === 'ClosestPointOfTwoLines';
}
