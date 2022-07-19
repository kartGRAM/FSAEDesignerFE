/* eslint-disable no-restricted-syntax */
export interface IFormula {
  name: string;
  formula: string;
  readonly evaluatedValue: number;
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
  | 'circular reference'
  | 'unexpected Error';

export function validateAll(formulae: IDataFormula[]): formulaErrors {
  return 'unexpected Error';
}

interface Node {
  nodes: string[];
  indegree: number;
}

function getNode(formula: string): Node {
  const names = getNamesFromFormula(formula) ?? [];
  return {nodes: names, indegree: 0};
}

function getNodes(formulae: IDataFormula[]): {[name: string]: Node} {
  const nodes: {[name: string]: Node} = {};
  formulae.forEach((formula) => {
    nodes[formula.name] = getNode(formula.formula);
  });
  for (const [, node] of Object.entries(nodes)) {
    for (const name of node.nodes) {
      nodes[name].indegree++;
    }
  }

  return nodes;
}

function getNamesFromFormula(formula: string): string[] | null {
  return /[a-zA-Z_][a-zA-Z0-9_]*/g.exec(formula);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function validate(formula: string): formulaErrors {
  return 'OK';
  // return 'unexpected Error';
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

  get evaluatedValue(): number {
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
