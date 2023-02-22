import {isObject} from '@utils/helpers';
import {IControl} from '@gd/controls/IControls';
import {IFormula, IDataFormula} from '@gd/IFormula';
import {Formula} from '@gd/Formula';

type SetterType = 'GlobalVariable' | 'Control';

export interface IParameterSetter {
  type: SetterType;
  targetNodeID: string;
  valueFormula: IFormula;
  evaluatedValue: number;
  getData(): IDataParameterSetter;
}

export interface IDataParameterSetter {
  isDataParameterSetter: true;
  type: SetterType;
  targetNodeID: string;
  valueFormula: IDataFormula;
}

function isDataParameterSetter(data: any): data is IDataParameterSetter {
  if (isObject(data) && data.isDataParameterSetter) return true;
  return false;
}

export class ParameterSetter implements IParameterSetter {
  type: SetterType;

  targetNodeID: string;

  valueFormula: Formula;

  get evaluatedValue() {
    return this.valueFormula.evaluatedValue;
  }

  getData(): IDataParameterSetter {
    return {
      isDataParameterSetter: true,
      type: this.type,
      valueFormula: this.valueFormula.getData(),
      targetNodeID: this.targetNodeID
    };
  }

  constructor(
    params:
      | {type: SetterType; target: IControl; valueFormula: string}
      | IDataParameterSetter
  ) {
    this.type = params.type;
    if (isDataParameterSetter(params)) {
      const data = params;
      this.targetNodeID = data.targetNodeID;
      this.valueFormula = new Formula(data.valueFormula);
    } else {
      this.targetNodeID = params.target.nodeID;
      this.valueFormula = new Formula({
        name: 'SetterValue',
        formula: params.valueFormula,
        absPath: `setterFor${this.targetNodeID}`
      });
    }
  }
}
