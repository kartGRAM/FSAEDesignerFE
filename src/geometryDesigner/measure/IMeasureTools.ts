import {IPoint, ILine, IPlane} from './IDatumObjects';

export interface IMeasureTool {
  isMeasureTool: true;
  readonly nodeID: string;
  readonly className: string;
  name: string;
  visibility: boolean;
  getData(): IDataMeasureTool;
  update(): void;
}

export interface IDataMeasureTool {
  isMeasureTool: true;
  readonly className: string;
}
