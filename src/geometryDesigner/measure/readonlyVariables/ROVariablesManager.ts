import {IMeasureToolsManager} from '@gd/measure/measureTools/IMeasureTools';
import {IAssembly} from '@gd/IElements';
import {
  IReadonlyVariable,
  IROVariablesManager,
  IDataReadonlyVariable
} from './IReadonlyVariable';

export class ROVariablesManager implements IROVariablesManager {
  children: IReadonlyVariable[];

  getMeasureTool(nodeID: string): IReadonlyVariable | undefined {
    return this.children.find((child) => child.nodeID === nodeID);
  }

  constructor(params: {
    assembly: IAssembly;
    measureToolsManager: IMeasureToolsManager;
    data?: IDataReadonlyVariable[];
  }) {
    const {assembyl, measureToolsManager, data} = params;
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

  getValuesAll(): MeasureSnapshot {
    const ret: MeasureSnapshot = {};
    this.children.forEach((child) => {
      ret[child.nodeID] = {name: child.name, values: child.value};
    });
    return ret;
  }
}
