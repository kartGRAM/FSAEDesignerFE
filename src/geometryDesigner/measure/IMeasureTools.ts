/* eslint-disable @typescript-eslint/no-unused-vars */
import {NodeID, IPoint, ILine, IPlane} from './IDatumObjects';

export interface IMeasureTool {
  isMeasureTool: true;
  readonly nodeID: string;
  readonly className: string;
  name: string;
  visibility: boolean;
  getData(): IDataMeasureTool;
  update(): void;
  readonly value: number;
}

export interface IDataMeasureTool {
  isMeasureTool: true;
  readonly className: string;
}

export interface IDistance extends IMeasureTool {
  isDistance: true;
  lhs: IPoint | ILine | IPlane;
  rhs: IPoint | ILine | IPlane;
}

export interface IDataDistance extends IMeasureTool {
  isDistance: true;
  lhs: NodeID;
  rhs: NodeID;
}

export interface IAngle extends IMeasureTool {
  isDistance: true;
  lhs: ILine | IPlane;
  rhs: ILine | IPlane;
}

export interface IDataAngle extends IMeasureTool {
  isDistance: true;
  lhs: NodeID;
  rhs: NodeID;
}
