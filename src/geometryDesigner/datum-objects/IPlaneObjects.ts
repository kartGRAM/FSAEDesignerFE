import {INamedNumber, IDataNumber} from '@gd/INamedValues';
import {IPlane, IPoint, ILine, NodeID, IDataPlane} from './IDatumObjects';

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
  getData(): IFromOtherPlane;
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
  point: IPoint;
  normal: ILine;
  getData(): IDataAxisPointPlane;
}

export interface IDataAxisPointPlane extends IDataPlane {
  className: 'AxisPointPlane';
  point: NodeID;
  normal: NodeID;
}

export interface IThreePointsPlane extends IPlane {
  className: 'ThreePointsPlane';
  points: [IPoint, IPoint, IPoint];
  getData(): IDataThreePointsPlane;
}

export interface IDataThreePointsPlane extends IDataPlane {
  className: 'ThreePointsPlane';
  points: [NodeID, NodeID, NodeID];
}
