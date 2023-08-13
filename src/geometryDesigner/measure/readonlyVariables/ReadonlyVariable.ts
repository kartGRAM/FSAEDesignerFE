// eslint-disable-next-line max-classes-per-file
import {
  IMeasureToolsManager,
  IMeasureTool,
  isMeasureTool
} from '@gd/measure/measureTools/IMeasureTools';
import {IElement, isElement, IAssembly} from '@gd/IElements';
import {v4 as uuidv4} from 'uuid';
import {getDgd} from '@store/getDgd';
import {evaluate} from '@gd/Formula';
import {
  IReadonlyVariable,
  IDataReadonlyVariable,
  IVariableSource,
  IDataVariableSource,
  isDataReadonlyVariable,
  isReadonlyVariable
} from './IReadonlyVariable';

export class VariableSource implements IVariableSource {
  source: IReadonlyVariable | IElement | IMeasureTool | null;

  target: string;

  name: string;

  get value(): number {
    const {source, target} = this;
    if (isReadonlyVariable(source)) {
      return source.value;
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
    source: IReadonlyVariable | IElement | IMeasureTool | null;
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
    } else if (isMeasureTool(source)) {
      sourceFrom = 'measureTool';
    }
    return {
      name: this.name,
      sourceFrom,
      sourceNodeID: this.source?.nodeID ?? '',
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
    try {
      const formulae = {...getDgd().formulae};
      this.sources.forEach((source) => {
        formulae.push({
          name: source.name,
          formula: `${source.value}`,
          absPath: ''
        });
      });
      const {formula} = this;
      this.tempValue = evaluate({formula, formulae});
    } catch {
      this.tempValue = Number.NaN;
    }
  }

  copy(other: IReadonlyVariable) {
    this.sources = other.sources.map(
      (s) =>
        new VariableSource({
          source: s.source,
          target: s.target,
          name: s.name
        })
    );
    this.formula = other.formula;
    this.name = other.name;
    this.update();
  }

  get value(): number {
    return this.tempValue;
  }

  constructor(
    params: {name: string} | IDataReadonlyVariable,
    assembly?: IAssembly,
    measureToolsManager?: IMeasureToolsManager,
    ROVariables?: IReadonlyVariable[]
  ) {
    const {name} = params;
    this.nodeID = uuidv4();
    this.name = name;
    this.formula = '0';
    this.sources = [];
    if (
      isDataReadonlyVariable(params) &&
      assembly &&
      measureToolsManager &&
      ROVariables
    ) {
      const {nodeID, sources, formula} = params;
      this.nodeID = nodeID;
      this.formula = formula;
      // eslint-disable-next-line array-callback-return, consistent-return
      this.sources = sources.map((s) => {
        const {target, name} = s;
        // eslint-disable-next-line default-case
        switch (s.sourceFrom) {
          case 'element': {
            const element = assembly.findElement(s.sourceNodeID);
            return new VariableSource({
              source: element ?? null,
              target,
              name
            });
          }
          case 'measureTool': {
            const tool = measureToolsManager.getMeasureTool(s.sourceNodeID);
            return new VariableSource({
              source: tool ?? null,
              target,
              name
            });
          }
          case 'readonlyVariable': {
            const variable = ROVariables.find(
              (v) => v.nodeID === s.sourceNodeID
            );
            return new VariableSource({
              source: variable ?? null,
              target,
              name
            });
          }
        }
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getData(): IDataReadonlyVariable {
    throw new Error('Method not implemented.');
  }
}
