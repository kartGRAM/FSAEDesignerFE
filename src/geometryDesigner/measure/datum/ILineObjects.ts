import {
  INamedNumber,
  IDataNumber,
  INamedVector3,
  IDataVector3
} from '@gd/INamedValues';
import {ILine, NodeID, IDataLine, IDataDatumObject} from './IDatumObjects';

export interface IPointDirectionLine extends ILine {
  className: 'PointDirectionLine';
  point: NodeID | INamedVector3;
  direction: NodeID | INamedVector3;
  getData(): IDataPointDirectionLine;
}

export function isPointDirectionLine(
  line: ILine | undefined
): line is IPointDirectionLine {
  if (!line) return false;
  return line.className === 'PointDirectionLine';
}

export interface IDataPointDirectionLine extends IDataLine {
  className: 'PointDirectionLine';
  point: NodeID | IDataVector3;
  direction: NodeID | IDataVector3;
}

export function isDataPointDirectionLine(
  data: IDataDatumObject
): data is IDataPointDirectionLine {
  if (data.className === 'PointDirectionLine') return true;
  return false;
}

export interface ITwoPointsLine extends ILine {
  className: 'TwoPointsLine';
  points: [NodeID, NodeID];
  getData(): IDataTwoPointsLine;
}

export function isTwoPointsLine(
  line: ILine | undefined
): line is ITwoPointsLine {
  if (!line) return false;
  return line.className === 'TwoPointsLine';
}

export interface IDataTwoPointsLine extends IDataLine {
  className: 'TwoPointsLine';
  points: [NodeID, NodeID];
}

export function isDataTwoPointsLine(
  data: IDataDatumObject
): data is IDataTwoPointsLine {
  if (data.className === 'TwoPointsLine') return true;
  return false;
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
