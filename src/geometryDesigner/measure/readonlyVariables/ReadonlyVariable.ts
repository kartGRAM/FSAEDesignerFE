// eslint-disable-next-line max-classes-per-file
import {IMeasureTool, isMeasureTool} from '@gd/measure/measureTools/IMeasureTools';
import {IElement, isElement } from '@gd/IElements';
import {IDataFormula, isFormula} from '@gd/IFormula';
import {
  IReadonlyVariable,
  IDataReadonlyVariable,
  IVariableSource,
  IDataVariableSource,
  isReadonlyVariable
} from './IReadonlyVariable';

export class VariableSource implements IVariableSource {
  source: IReadonlyVariable | IElement | IMeasureTool | IDataFormula | null;

  target: string;

  name: string;

  get value(): number {}

  constructor(params: {
    source: IReadonlyVariable | IElement | IMeasureTool | IDataFormula | null;
    target: string;
    name: string;
  }) {
    const {source, target, name} = params;
  }

  getData(): IDataVariableSource {
    let sourceFrom: IDataVariableSource["sourceFrom"] = "measureTool";
    const {source} = this;
    if( isElement(source) ){
        sourceFrom = "element";
    }else{
    }
    return {
        name: this.name;

    }
  }
}

export class ReadonlyVariables implements IReadonlyVariable {
  nodeID: string;

  sources: IVariableSource[];

  name: string;

  formula: string;

  value: number;

  getData(): IDataReadonlyVariable {
    throw new Error('Method not implemented.');
  }
}
