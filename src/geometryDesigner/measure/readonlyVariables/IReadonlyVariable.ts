import {IElement} from '@gd/IElements';
import {IMeasureTool} from '@gd/measure/measureTools/IMeasureTools';
import {ROVariablesSnapshot} from '@gd/analysis/ISnapshot';
import {isObject} from '@utils/helpers';

export type GlobalVariableName = {
  isGlobalVariableName: true;
  name: string;
};

export function isGlobalVariableName(
  object: any
): object is GlobalVariableName {
  return isObject(object) && object.isGlobalVariableName;
}

export interface IVariableSource {
  source:
    | IElement
    | IMeasureTool
    | GlobalVariableName
    | IReadonlyVariable
    | null;
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
  isDataReadonlyVariable: true;
  nodeID: string;
  sources: IDataVariableSource[];
  name: string;
  formula: string;
}

export function isReadonlyVariable(object: any): object is IReadonlyVariable {
  return isObject(object) && object.isReadonlyVariable;
}
export function isDataReadonlyVariable(
  object: any
): object is IDataReadonlyVariable {
  return isObject(object) && object.isDataReadonlyVariable;
}

export interface IROVariablesManager {
  children: IReadonlyVariable[];

  getVariable(nodeID: string): IReadonlyVariable | undefined;

  update(): void;

  getValuesAll(): ROVariablesSnapshot;
}
