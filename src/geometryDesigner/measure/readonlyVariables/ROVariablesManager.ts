import {IMeasureToolsManager} from '@gd/measure/measureTools/IMeasureTools';
import {IAssembly} from '@gd/IElements';
import {ROVariablesSnapshot} from '@gd/analysis/ISnapshot';
import {
  IReadonlyVariable,
  IROVariablesManager,
  IDataReadonlyVariable
} from './IReadonlyVariable';
import {ReadonlyVariable} from './ReadonlyVariable';

export class ROVariablesManager implements IROVariablesManager {
  children: IReadonlyVariable[];

  getVariable(nodeID: string): IReadonlyVariable | undefined {
    return this.children.find((child) => child.nodeID === nodeID);
  }

  constructor(params: {
    assembly: IAssembly;
    measureToolsManager: IMeasureToolsManager;
    data?: IDataReadonlyVariable[];
  }) {
    const {assembly, measureToolsManager, data} = params;
    this.children = [];
    if (data) {
      data.forEach((v) => {
        this.children.push(
          new ReadonlyVariable(v, assembly, measureToolsManager, this.children)
        );
      });
    }
  }

  update(): void {
    this.children.forEach((child) => child.update());
  }

  getValuesAll(): ROVariablesSnapshot {
    const ret: ROVariablesSnapshot = {};
    this.children.forEach((child) => {
      ret[child.nodeID] = {name: child.name, value: child.value};
    });
    return ret;
  }
}
