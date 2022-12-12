import {
  IMeasureTool,
  IDataMeasureTool,
  IMeasureToolsManager
} from '@gd/measure/IMeasureTools';
import {getMeasureTool} from '@gd/measure/MeasureTools';
import {IDatumManager} from './IDatumObjects';

export class MeasureToolsManager implements IMeasureToolsManager {
  children: IMeasureTool[];

  getMeasureTool(nodeID: string): IMeasureTool | undefined {
    return this.children.find((child) => child.nodeID === nodeID);
  }

  constructor(datumManager: IDatumManager, data?: IDataMeasureTool[]) {
    this.children = (data ?? []).map((data) =>
      getMeasureTool(data, datumManager)
    );
  }

  update(): void {
    this.children.forEach((child) => child.update());
  }
}
