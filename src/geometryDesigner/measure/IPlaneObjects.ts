import {INamedNumber, IDataNumber} from '@gd/INamedValues';
import {
  IPlane,
  IPoint,
  ILine,
  NodeID,
  IDataPlane,
  IDataDatumObject
} from './IDatumObjects';

export interface IFromXYPlane extends IPlane {
  className: 'FromXYPlane';
  distance: INamedNumber;
  getData(): IDataFromXYPlane;
}

export interface IDataFromXYPlane extends IDataPlane {
  className: 'FromXYPlane';
  distance: IDataNumber;
}

export interface IFromYZPlane extends IPlane {
  className: 'FromYZPlane';
  distance: INamedNumber;
  getData(): IDataFromYZPlane;
}

export interface IDataFromYZPlane extends IDataPlane {
  className: 'FromYZPlane';
  distance: IDataNumber;
}

export interface IFromZXPlane extends IPlane {
  className: 'FromZXPlane';
  distance: INamedNumber;
  getData(): IDataFromZXPlane;
}

export interface IDataFromZXPlane extends IDataPlane {
  className: 'FromZXPlane';
  distance: IDataNumber;
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

export interface IPointNormalLinePlane extends IPlane {
  className: 'PointNormalLinePlane';
  point: IPoint;
  normal: ILine;
  getData(): IDataPointNormalLinePlane;
}

export interface IDataPointNormalLinePlane extends IDataPlane {
  className: 'PointNormalLinePlane';
  point: NodeID;
  normal: NodeID;
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
