import {isObject} from '@utils/helpers';
import {IDataControl, Control} from '@gd/controls/IControls';
import {getControl} from '@gd/controls/Controls';
import {getDgd} from '@store/getDgd';
import {IFormula, IDataFormula} from '@gd/IFormula';
import {Formula} from '@gd/Formula';
import {KinematicsSolver} from '@gd/kinematics/KinematicsSolver';

export type SweeperType = 'GlobalVariable' | 'Control';

export type Mode = 'division' | 'step';

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
  mode: Mode;
  getData(): IDataParameterSweeper;
  // endまで行っていたらtrueを返す
  set(solver: KinematicsSolver, step: number): boolean;
}

export interface IDataParameterSweeper {
  isDataParameterSweeper: true;
  type: SweeperType;
  target: string;
  startFormula: IDataFormula;
  endFormula: IDataFormula;
  stepFormula: IDataFormula;
  divisionFormula: IDataFormula;
  mode: 'division' | 'step';
}

function isDataParameterSweeper(data: any): data is IDataParameterSweeper {
  if (isObject(data) && data.isDataParameterSweeper) return true;
  return false;
}

export class ParameterSweeper implements IParameterSweeper {
  type: SweeperType;

  target: string;

  set(solver: KinematicsSolver, step: number): boolean {
    const eps = Number.EPSILON * 2 ** 8;
    const {startValue, stepValue, endValue} = this;
    let value = startValue + stepValue * step;
    if (stepValue >= 0 && value > endValue) value = endValue;
    if (stepValue < 0 && value < endValue) value = endValue;

    if (this.type === 'Control') {
      const {control} = this;
      if (!control) throw new Error('Some Controls are undefinced.');
      control.preprocess(0, solver, value);
    }

    return Math.abs(value - endValue) < eps;
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

  startFormula: Formula;

  endFormula: Formula;

  stepFormula: Formula;

  divisionFormula: Formula;

  mode: 'division' | 'step';

  get startValue() {
    return this.startFormula.evaluatedValue;
  }

  get endValue() {
    return this.endFormula.evaluatedValue;
  }

  get stepValue() {
    return this.stepFormula.evaluatedValue;
  }

  getData(): IDataParameterSweeper {
    return {
      isDataParameterSweeper: true,
      type: this.type,
      startFormula: this.startFormula.getData(),
      endFormula: this.endFormula.getData(),
      stepFormula: this.stepFormula.getData(),
      divisionFormula: this.divisionFormula.getData(),
      target: this.target,
      mode: this.mode
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
      | {
          type: SweeperType;
          target: IDataControl;
          startFormula: string;
          endFormula: string;
          mode: 'division' | 'step';
          divisionFormula?: string;
          stepFormula?: string;
        }
      | IDataParameterSweeper
  ) {
    this.type = params.type;
    this.mode = params.mode;
    if (isDataParameterSweeper(params)) {
      const data = params;
      this.target = data.target;
      this.startFormula = new Formula(data.startFormula);
      this.endFormula = new Formula(data.endFormula);
      this.stepFormula = new Formula(data.stepFormula);
      this.divisionFormula = new Formula(data.divisionFormula);
    } else {
      this.target = params.target.nodeID;
      this.startFormula = new Formula({
        name: 'startValue',
        formula: params.startFormula,
        absPath: `startValueSetterFor${this.target}`
      });
      this.endFormula = new Formula({
        name: 'endValue',
        formula: params.endFormula,
        absPath: `endValueSetterFor${this.target}`
      });
      this.stepFormula = new Formula({
        name: 'stepValue',
        formula: params.stepFormula ?? '1',
        absPath: `stepValueFor${this.target}`
      });
      this.divisionFormula = new Formula({
        name: 'divisionValue',
        formula: params.divisionFormula ?? '1',
        absPath: `divisionValueFor${this.target}`
      });
    }
  }
}
