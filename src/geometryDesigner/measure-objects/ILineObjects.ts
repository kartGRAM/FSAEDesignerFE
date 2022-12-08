import {
  INamedNumber,
  IDataNumber,
  INamedVector3,
  IDataVector3
} from '@gd/INamedValues';
import {IPlane, IPoint, ILine, NodeID, IDataLine} from './IMeasureObjects';

export interface ITwoPointsLine extends ILine {
  className: 'TwoPointLine';
  points: [IPoint, IPoint];
  getData(): IDataTwoPointsLine;
}

export interface IDataTwoPointsLine extends IDataLine {
  className: 'TwoPointsLine';
  point: [NodeID, NodeID];
}

export interface IPointDirectionLine extends ILine {
  className: 'PointDirectionLine';
  point: IPoint;
  direction: INamedVector3;
  getData(): IDataPointDirectionLine;
}

export interface IDataPointDirectionLine extends IDataLine {
  className: 'PointDirectionLine';
  point: NodeID;
  direction: IDataVector3;
}

export interface ITwoPlaneIntersectionLine extends ILine {
  className: 'TwoPlaneIntersectionLine';
  planes: [IPlane, IPlane];
  getData(): IDataTwoPlaneIntersectionLine;
}

export interface IDataTwoPlaneIntersectionLine extends IDataLine {
  className: 'TwoPlaneIntersectionLine';
  planes: [NodeID, NodeID];
}

export interface IFromOtherLine extends ILine {
  className: 'FromOtherLine';
  line: ILine;
  distance: INamedNumber;
  getData(): IDataFromOtherLine;
}

export interface IDataFromOtherLine extends IDataLine {
  className: 'FromOtherLine';
  line: NodeID;
  distance: IDataNumber;
}
