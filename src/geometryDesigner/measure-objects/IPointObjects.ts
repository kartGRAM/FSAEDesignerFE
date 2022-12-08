import {INamedVector3, IDataVector3} from '@gd/INamedValues';
import {IPlane, IPoint, ILine, NodeID, IDataPoint} from './IMeasureObjects';

export interface IElementPoint extends IPoint {
  className: 'ElementPoint';
  element: NodeID;
  point: NodeID;
  getData(): IDataElementPoint;
}

export interface IDataElementPoint extends IDataPoint {
  className: 'ElementPoint';
  element: NodeID;
  point: NodeID;
}

export interface IFixedPoint extends IPoint {
  className: 'FixedPoint';
  position: INamedVector3;
  getData(): IDataFixedPoint;
}

export interface IDataFixedPoint extends IDataPoint {
  className: 'FixedPoint';
  position: IDataVector3;
}

export interface IPlaneLineIntersection extends IPoint {
  className: 'PlaneLineIntersection';
  plane: IPlane;
  line: ILine;
  getData(): IDataElementPoint;
}

export interface IDataPlaneLineIntersection extends IPoint {
  className: 'PlaneLineIntersection';
  plane: NodeID;
  line: NodeID;
}

export interface IProjectionPointToPlane extends IPoint {
  className: 'ProjectionPointToPlane';
  plane: IPlane;
  point: IPoint;
  getData(): IDataProjectionPointToPlane;
}

export interface IDataProjectionPointToPlane extends IPoint {
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

export interface IDataProjectionPointToLine extends IPoint {
  className: 'ProjectionPointToLine';
  plane: NodeID;
  line: NodeID;
}
