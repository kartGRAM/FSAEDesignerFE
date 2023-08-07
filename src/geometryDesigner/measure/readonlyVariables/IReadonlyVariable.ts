import {IElement} from '@gd/IElements';
import {IMeasureTool} from '@gd/measure/measureTools/IMeasureTools';
import {IDataFormula} from '@gd/IFormula';
import {ROVariablesSnapshot} from '@gd/analysis/ISnapshot';
import {isObject} from '@utils/helpers';

export interface IVariableSource {
  source: IElement | IMeasureTool | IDataFormula | IReadonlyVariable | null;
  target: string;
  name: string;
  readonly value: number;
  getData(): IDataVariableSource;
}

export interface IDataVariableSource {
  sourceFrom: 'element' | 'measureTool' | 'global' | 'readonlyVariable';
  sourceNodeID: string;
  target: string;
  name: string;
}

export interface IReadonlyVariable {
  isReadonlyVariable: true;
  nodeID: string;
  sources: IVariableSource[];
  name: string;
  formula: string;
  readonly value: number;
  update(): void;
  getData(): IDataReadonlyVariable;
}

export interface IDataReadonlyVariable {
  nodeID: string;
  sources: IDataVariableSource[];
  name: string;
  formula: string;
}

export function isReadonlyVariable(object: any): object is IReadonlyVariable {
  return isObject(object) && object.isReadonlyVariable;
}

export interface IROVariablesManager {
  children: IReadonlyVariable[];

  getMeasureTool(nodeID: string): IReadonlyVariable | undefined;

  update(): void;

  getValuesAll(): ROVariablesSnapshot;
}
