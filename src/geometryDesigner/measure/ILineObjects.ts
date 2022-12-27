import {
  INamedNumber,
  IDataNumber,
  INamedVector3,
  IDataVector3
} from '@gd/INamedValues';
import {
  IPlane,
  IPoint,
  ILine,
  NodeID,
  IDataLine,
  IDataDatumObject
} from './IDatumObjects';

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
  planes: [NodeID, NodeID];
  getData(): IDataTwoPlaneIntersectionLine;
}

export function isTwoPlaneIntersectionLine(
  line: ILine | undefined
): line is ITwoPlaneIntersectionLine {
  if (!line) return false;
  return line.className === 'TwoPlaneIntersectionLine';
}

export interface IDataTwoPlaneIntersectionLine extends IDataLine {
  className: 'TwoPlaneIntersectionLine';
  planes: [NodeID, NodeID];
}

export function isDataTwoPlaneIntersectionLine(
  data: IDataDatumObject
): data is IDataTwoPlaneIntersectionLine {
  if (data.className === 'TwoPlaneIntersectionLine') return true;
  return false;
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
