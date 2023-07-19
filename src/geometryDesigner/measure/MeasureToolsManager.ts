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
    this.children = [];
    const dataFilled = data ?? [];
    for (const row of dataFilled) {
      try {
        const child = getMeasureTool(row, datumManager);
        this.children.push(child);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
      }
    }
  }

  update(): void {
    this.children.forEach((child) => child.update());
  }

  getValuesAll(): {
    [index: string]: {
      readonly name: string;
      readonly values: {[index: string]: number};
    };
  } {
    const ret: {
      [index: string]: {
        readonly name: string;
        readonly values: {[index: string]: number};
      };
    } = {};
    this.children.forEach((child) => {
      ret[child.nodeID] = {name: child.name, values: child.value};
    });
    return ret;
  }
}
