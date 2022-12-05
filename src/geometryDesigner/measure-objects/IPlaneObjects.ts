import {INamedNumber, IDataNumber} from '@gd/INamedValues';
import {IPlane, IPoint, ILine, NodeID, IDataPlane} from './IMeasureObjects';

export interface FromXYPlane extends IPlane {
  className: 'FromXYPlane';
  distance: INamedNumber;
  getData(): IDataPointNormalPlane;
}

export interface DataFromXYPlane extends IDataPlane {
  className: 'FromXYPlane';
  distance: IDataNumber;
}

export interface FromYZPlane extends IPlane {
  className: 'FromYZPlane';
  distance: INamedNumber;
  getData(): IDataPointNormalPlane;
}

export interface DataFromYZPlane extends IDataPlane {
  className: 'FromYZPlane';
  distance: IDataNumber;
}

export interface FromZXPlane extends IPlane {
  className: 'FromZXPlane';
  distance: INamedNumber;
  getData(): IDataPointNormalPlane;
}

export interface DataFromZXPlane extends IDataPlane {
  className: 'FromZXPlane';
  distance: IDataNumber;
}

export interface FromOtherPlane extends IPlane {
  className: 'FromOtherPlane';
  Plane: IPlane;
  distance: INamedNumber;
  getData(): IDataPointNormalPlane;
}

export interface DataFromOtherPlane extends IDataPlane {
  className: 'FromOtherPlane';
  distance: IDataNumber;
}

export interface IPointNormalPlane extends IPlane {
  point: IPoint;
  direction: ILine;
  getData(): IDataPointNormalPlane;
}

export interface IDataPointNormalPlane extends IDataPlane {
  point: NodeID;
  direction: NodeID;
}

export interface IThreePointsPlane extends IPlane {
  points: [IPoint, IPoint, IPoint];
  getData(): IDataThreePointsPlane;
}

export interface IDataThreePointsPlane extends IDataPlane {
  points: [NodeID, NodeID, NodeID];
}
