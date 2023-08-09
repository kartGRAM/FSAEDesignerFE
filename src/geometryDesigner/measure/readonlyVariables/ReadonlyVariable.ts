// eslint-disable-next-line max-classes-per-file
import {
  IMeasureTool,
  isMeasureTool
} from '@gd/measure/measureTools/IMeasureTools';
import {IElement, isElement} from '@gd/IElements';
import * as math from 'mathjs';
import {v4 as uuidv4} from 'uuid';
import {getDgd} from '@store/getDgd';
import {evaluate} from '@gd/Formula';
import {
  IReadonlyVariable,
  IDataReadonlyVariable,
  IVariableSource,
  IDataVariableSource,
  isReadonlyVariable,
  isGlobalVariableName,
  GlobalVariableName
} from './IReadonlyVariable';

export class VariableSource implements IVariableSource {
  source:
    | IReadonlyVariable
    | IElement
    | IMeasureTool
    | GlobalVariableName
    | null;

  target: string;

  name: string;

  get value(): number {
    const {source, target} = this;
    if (isReadonlyVariable(source)) {
      return source.value;
    }
    if (isGlobalVariableName(source)) {
      const {formulae} = getDgd();
      const formula = formulae.find((f) => f.name === source.name)?.formula;
      if (!formula) return Number.NaN;
      return evaluate({formula, formulae});
    }
    if (isElement(source)) {
      const vars = source.getVariables();
      return vars.find((v) => v.nodeID === target)?.value ?? Number.NaN;
    }
    if (isMeasureTool(source)) {
      const {value} = source;
      return value[target] ?? Number.NaN;
    }
    return Number.NaN;
  }

  constructor(params: {
    source:
      | IReadonlyVariable
      | IElement
      | IMeasureTool
      | GlobalVariableName
      | null;
    target: string;
    name: string;
  }) {
    const {source, target, name} = params;
    this.source = source;
    this.target = target;
    this.name = name;
  }

  getData(): IDataVariableSource {
    const {source} = this;
    let sourceFrom: IDataVariableSource['sourceFrom'] = 'readonlyVariable';
    if (isElement(source)) {
      sourceFrom = 'element';
    } else if (isGlobalVariableName(source)) {
      sourceFrom = 'global';
    } else if (isMeasureTool(source)) {
      sourceFrom = 'measureTool';
    }
    return {
      name: this.name,
      sourceFrom,
      sourceNodeID:
        (isGlobalVariableName(this.source)
          ? this.source?.name
          : this.source?.nodeID) ?? '',
      target: this.target
    };
  }
}

export class ReadonlyVariable implements IReadonlyVariable {
  isReadonlyVariable = true as const;

  nodeID: string;

  sources: IVariableSource[];

  name: string;

  formula: string;

  private tempValue: number = Number.NaN;

  update() {
    const scope: {[key: string]: number} = {};
    this.sources.forEach((source) => {
      math.evaluate(`${source.name}=${source.value}`, scope);
    });
    math.evaluate(`___temp___=${this.formula}`, scope);
    // eslint-disable-next-line no-underscore-dangle
    this.tempValue = scope.___temp___;
  }

  get value(): number {
    return this.tempValue;
  }

  constructor(params: {name: string; formula: string} | IDataReadonlyVariable) {
    const {name, formula} = params;
    this.nodeID = uuidv4();
    this.name = name;
    this.formula = formula;
    this.sources = [];
  }

  // eslint-disable-next-line class-methods-use-this
  getData(): IDataReadonlyVariable {
    throw new Error('Method not implemented.');
  }
}
