import {
  IMeasureTool,
  IDataMeasureTool,
  IMeasureToolsManager
} from '@gd/measure/measureTools/IMeasureTools';
import {getMeasureTool} from '@gd/measure/measureTools/MeasureTools';
import {MeasureSnapshot} from '@gd/analysis/ISnapshot';
import {IMovingElement} from '@gd/IElements';
import {IDatumManager} from '../datum/IDatumObjects';

export class MeasureToolsManager implements IMeasureToolsManager {
  children: IMeasureTool[];

  getMeasureTool(nodeID: string): IMeasureTool | undefined {
    return this.children.find((child) => child.nodeID === nodeID);
  }

  constructor(
    datumManager: IDatumManager,
    elements: IMovingElement[],
    data?: IDataMeasureTool[]
  ) {
    this.children = [];
    const dataFilled = data ?? [];
    for (const row of dataFilled) {
      try {
        const child = getMeasureTool(row, datumManager, elements);
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

  getValuesAll(): MeasureSnapshot {
    const ret: MeasureSnapshot = {};
    this.children.forEach((child) => {
      ret[child.nodeID] = {name: child.name, values: child.value};
    });
    return ret;
  }
}
