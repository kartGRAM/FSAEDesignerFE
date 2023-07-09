import {isObject} from '@utils/helpers';
import {IDataControl, Control} from '@gd/controls/IControls';
import {getControl} from '@gd/controls/Controls';

import {IFormula, IDataFormula} from '@gd/IFormula';
import {Formula} from '@gd/Formula';
import store from '@store/store';
import {KinematicSolver} from '@gd/kinematics/Solver';

export type SetterType = 'GlobalVariable' | 'Control';

export interface IParameterSetter {
  type: SetterType;
  readonly name: string;
  target: string;
  valueFormula: IFormula;
  readonly evaluatedValue: number;
  getData(): IDataParameterSetter;
  set(solver: KinematicSolver): void;
}

export interface IDataParameterSetter {
  isDataParameterSetter: true;
  type: SetterType;
  target: string;
  valueFormula: IDataFormula;
}

function isDataParameterSetter(data: any): data is IDataParameterSetter {
  if (isObject(data) && data.isDataParameterSetter) return true;
  return false;
}

export class ParameterSetter implements IParameterSetter {
  type: SetterType;

  target: string;

  set(solver: KinematicSolver): void {
    if (this.type === 'Control') {
      const {control} = this;
      if (!control) throw new Error('Some Controls are undefinced.');
      control.preprocess(0, solver, this.evaluatedValue);
    }
  }

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

  getData(): IDataParameterSetter {
    return {
      isDataParameterSetter: true,
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
      | {type: SetterType; target: IDataControl; valueFormula: string}
      | IDataParameterSetter
  ) {
    this.type = params.type;
    if (isDataParameterSetter(params)) {
      const data = params;
      this.target = data.target;
      this.valueFormula = new Formula(data.valueFormula);
    } else {
      this.target = params.target.nodeID;
      this.valueFormula = new Formula({
        name: 'SetterValue',
        formula: params.valueFormula,
        absPath: `setterFor${this.target}`
      });
    }
  }
}
