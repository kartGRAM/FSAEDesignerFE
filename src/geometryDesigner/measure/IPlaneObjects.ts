import {
  INamedNumber,
  IDataNumber,
  INamedVector3,
  IDataVector3
} from '@gd/INamedValues';
import {IPlane, NodeID, IDataPlane, IDataDatumObject} from './IDatumObjects';

export type BasePlane = 'XY' | 'YZ' | 'ZX';

export interface IFromBasePlane extends IPlane {
  className: 'FromBasePlane';
  direction: BasePlane;
  distance: INamedNumber;
  getData(): IDataFromBasePlane;
}

export interface IDataFromBasePlane extends IDataPlane {
  className: 'FromBasePlane';
  direction: BasePlane;
  distance: IDataNumber;
}

export interface IPointNormalLinePlane extends IPlane {
  className: 'PointNormalLinePlane';
  point: NodeID | INamedVector3;
  normal: NodeID | INamedVector3;
  getData(): IDataPointNormalLinePlane;
}

export function isPointNormalLinePlane(
  plane: IPlane | undefined
): plane is IPointNormalLinePlane {
  if (!plane) return false;
  return plane.className === 'PointNormalLinePlane';
}

export interface IDataPointNormalLinePlane extends IDataPlane {
  className: 'PointNormalLinePlane';
  point: NodeID | IDataVector3;
  normal: NodeID | IDataVector3;
}

export function isDataPointNomalLinePlane(
  data: IDataDatumObject
): data is IDataPointNormalLinePlane {
  if (data.className === 'PointNormalLinePlane') return true;
  return false;
}

export interface IFromElementBasePlane extends IPlane {
  className: 'FromElementBasePlane';
  element: NodeID;
  direction: BasePlane;
  distance: INamedNumber;
  getData(): IDataFromElementBasePlane;
}

export function isFromElementBasePlane(
  plane: IPlane | undefined
): plane is IFromElementBasePlane {
  if (!plane) return false;
  return plane.className === 'FromElementBasePlane';
}

export interface IDataFromElementBasePlane extends IDataPlane {
  className: 'FromElementBasePlane';
  element: NodeID;
  direction: BasePlane;
  distance: IDataNumber;
}

export function isDataFromElementBasePlane(
  data: IDataDatumObject
): data is IDataFromElementBasePlane {
  if (data.className === 'FromElementBasePlane') return true;
  return false;
}

export interface IFromOtherPlane extends IPlane {
  className: 'FromOtherPlane';
  plane: IPlane;
  distance: INamedNumber;
  getData(): IDataFromOtherPlane;
}

export interface IDataFromOtherPlane extends IDataPlane {
  className: 'FromOtherPlane';
  distance: IDataNumber;
}

export interface IAxisPointPlane extends IPlane {
  className: 'AxisPointPlane';
  point: NodeID;
  line: NodeID;
  getData(): IDataAxisPointPlane;
}

export function isAxisPointPlane(
  plane: IPlane | undefined
): plane is IAxisPointPlane {
  if (!plane) return false;
  return plane.className === 'AxisPointPlane';
}

export interface IDataAxisPointPlane extends IDataPlane {
  className: 'AxisPointPlane';
  point: NodeID;
  line: NodeID;
}

export function isDataAxisPointPlane(
  data: IDataDatumObject
): data is IDataAxisPointPlane {
  if (data.className === 'AxisPointPlane') return true;
  return false;
}

export interface IThreePointsPlane extends IPlane {
  className: 'ThreePointsPlane';
  points: [NodeID, NodeID, NodeID];
  getData(): IDataThreePointsPlane;
}

export function isThreePointsPlane(
  plane: IPlane | undefined
): plane is IThreePointsPlane {
  if (!plane) return false;
  return plane.className === 'ThreePointsPlane';
}

export interface IDataThreePointsPlane extends IDataPlane {
  className: 'ThreePointsPlane';
  points: [NodeID, NodeID, NodeID];
}

export function isDataThreePointsPlane(
  data: IDataDatumObject
): data is IDataThreePointsPlane {
  if (data.className === 'ThreePointsPlane') return true;
  return false;
}
