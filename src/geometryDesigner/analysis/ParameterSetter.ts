import {isObject} from '@utils/helpers';
import {IDataControl, Control} from '@gd/controls/IControls';
import {getControl} from '@gd/controls/Controls';
import {IFormula, IDataFormula} from '@gd/IFormula';
import {Formula} from '@gd/Formula';
import {getDgd, dispatch} from '@store/getDgd';
import {ISolver} from '@gd/kinematics/ISolver';
import {swapFormulae} from '@store/reducers/dataGeometryDesigner';

export type SetterType = 'GlobalVariable' | 'Control';

export interface IParameterSetter {
  type: SetterType;
  readonly name: string;
  target: string;
  valueFormula: IFormula;
  readonly evaluatedValue: number;
  getData(): IDataParameterSetter;
  set(solver: ISolver): void;
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

  set(solver: ISolver): void {
    if (this.type === 'Control') {
      const {control} = this;
      if (!control) throw new Error('Some Controls are undefined.');
      control.preprocess(0, solver, this.evaluatedValue);
      return;
    }
    if (this.type === 'GlobalVariable') {
      const {formulae} = getDgd();
      const dFormula = formulae.find((f) => f.absPath === this.target);
      if (!dFormula) throw new Error('Some formulae are undefined.');
      const formula = new Formula(dFormula);
      formula.formula = this.valueFormula.formula;
      const newFormulae = [
        ...formulae.filter((f) => f.absPath !== this.target),
        formula.getData()
      ];
      dispatch(swapFormulae(newFormulae));
      solver.reConstruct();
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
    const {controls, options} = getDgd();
    const control = controls.find(
      (c) =>
        c.nodeID === this.target &&
        (c.configuration ?? 'FixedFrame') === options.assemblyMode
    );
    return control ? getControl(control) : undefined;
  }

  get globalVariable(): IFormula | undefined {
    const {formulae} = getDgd();
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
