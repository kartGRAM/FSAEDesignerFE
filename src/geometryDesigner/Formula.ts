export interface IFormula {
  name: string;
  formula: string;
  readonly value: number;
  readonly absPath: string;
  getData(): IDataFormula;
}

export interface IDataFormula {
  name: string;
  formula: string;
  readonly absPath: string;
}

export function replaceVariable(
  formula: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  replacement: string
): string {
  return formula;
}

type formulaErrors =
  | 'OK'
  | 'duplicated name'
  | 'unknown valiable(s) are contained'
  | 'devided by zero'
  | 'unexpected Error';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function validateAll(formulae: IDataFormula[]): formulaErrors {
  return 'unexpected Error';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function validate(formula: string): formulaErrors {
  return 'unexpected Error';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function evaluate(formula: string): number {
  return 0;
}

export class Formula implements IFormula {
  name: string;

  private _formula: string;

  readonly absPath: string;

  get formula(): string {
    return this._formula;
  }

  set formula(formula: string) {
    if (validate(formula) === 'OK') this._formula = formula;
  }

  get value(): number {
    return evaluate(this.formula);
  }

  getData(): IDataFormula {
    return {name: this.name, formula: this.formula, absPath: this.absPath};
  }

  constructor(
    params: {name: string; formula?: string; absPath?: string} | IDataFormula
  ) {
    const {name, formula, absPath} = params;
    this.name = name;
    this._formula = '0';
    this.absPath = absPath ?? 'global';
    if (formula) {
      // with Validation
      this.formula = formula;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function toIFormula(formula: Formula): IFormula {
  return formula;
}

export function getAllValiables(formulae: IDataFormula[]): {
  [name: string]: IFormula;
} {
  const tmp: {[name: string]: IFormula} = {};
  formulae.forEach((value) => {
    tmp[value.name] = new Formula(value);
  });
  return tmp;
}
