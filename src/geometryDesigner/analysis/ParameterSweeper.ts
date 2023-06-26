import {isObject} from '@utils/helpers';
import {IDataControl, Control} from '@gd/controls/IControls';
import {getControl} from '@gd/controls/Controls';

import {IFormula, IDataFormula} from '@gd/IFormula';
import {Formula} from '@gd/Formula';
import store from '@store/store';

export type SweeperType = 'GlobalVariable' | 'Control';

export interface IParameterSweeper {
  type: SweeperType;
  readonly name: string;
  target: string;
  startFormula: IFormula;
  endFormula: IFormula;
  stepFormula: IFormula;
  divisionFormula: IFormula;
  readonly startValue: number;
  readonly endValue: number;
  readonly stepValue: number;
  readonly divisionValue: number;
  divisionMode: boolean;
  getData(): IDataParameterSweeper;
}

export interface IDataParameterSweeper {
  isDataParameterSweeper: true;
  type: SweeperType;
  target: string;
  startFormula: IDataFormula;
  endFormula: IDataFormula;
  stepFormula: IDataFormula;
  divisionFormula: IDataFormula;
}

function isDataParameterSweeper(data: any): data is IDataParameterSweeper {
  if (isObject(data) && data.isDataParameterSweeper) return true;
  return false;
}

export class ParameterSweeper implements IParameterSweeper {
  type: SweeperType;

  target: string;

  get name(): string {
    if (this.type === 'Control') {
      const {control} = this;
      return control?.name ?? 'component not found';
    }
    if (this.type === 'GlobalVariable') {
      const {globalVariable} = this;
      return globalVariable?.name ?? 'global variable not found';
    }
    return 'error';
  }

  valueFormula: Formula;

  get evaluatedValue() {
    return this.valueFormula.evaluatedValue;
  }

  getData(): IDataParameterSweeper {
    return {
      isDataParameterSweeper: true,
      type: this.type,
      valueFormula: this.valueFormula.getData(),
      target: this.target
    };
  }

  get control(): Control | undefined {
    const {controls} = store.getState().dgd.present;
    const control = controls.find((c) => c.nodeID === this.target);
    return control ? getControl(control) : undefined;
  }

  get globalVariable(): IFormula | undefined {
    const {formulae} = store.getState().dgd.present;
    const dataFormula = formulae.find((f) => f.name === this.target);
    return dataFormula ? new Formula(dataFormula) : undefined;
  }

  constructor(
    params:
      | {type: SweeperType; target: IDataControl; valueFormula: string}
      | IDataParameterSweeper
  ) {
    this.type = params.type;
    if (isDataParameterSweeper(params)) {
      const data = params;
      this.target = data.target;
      this.valueFormula = new Formula(data.valueFormula);
    } else {
      this.target = params.target.nodeID;
      this.valueFormula = new Formula({
        name: 'SweeperValue',
        formula: params.valueFormula,
        absPath: `setterFor${this.target}`
      });
    }
  }
}
