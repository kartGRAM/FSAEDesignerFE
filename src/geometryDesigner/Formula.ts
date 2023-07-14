import {
  IDataFormula,
  IFormula,
  FormulaError,
  Node,
  Nodes,
  getNode,
  getNodes,
  isFormulaErrors,
  topologicalSort
} from '@gd/IFormula';
import * as math from 'mathjs';
import {getDgd} from '@store/getDgd';
import {isNumber} from '@app/utils/helpers';

export function validate(
  formula: IDataFormula,
  formulae?: IDataFormula[]
): FormulaError {
  try {
    if (!formulae) {
      formulae = getDgd().formulae;
    }
    const ret1 = getNodesFromFormula(formula, formulae);
    if (isFormulaErrors(ret1)) return ret1;
    const ret2 = topologicalSort(ret1);
    if (isFormulaErrors(ret2)) return ret2;
    try {
      const scope: {[key: string]: unknown} = {};
      for (const node of ret2) {
        math.evaluate(`${node.name}=${node.formula}`, scope);
      }
      Object.values(scope).forEach((value) => {
        if (typeof value !== 'number') throw new Error('invalid');
      });
    } catch (e) {
      return 'invalid formula(e)';
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    return 'unexpected error';
  }

  return 'OK';
  // return 'unexpected Error';
}

export function evaluate(formula: string, formulae?: IDataFormula[]): number {
  if (!formulae) {
    formulae = getDgd().formulae;
  }
  const ret1 = getNodesFromFormula(
    {name: '___temp___', formula, absPath: '___temp___'},
    formulae
  ) as Node[];
  const ret2 = topologicalSort(ret1) as Node[];
  const scope: {[key: string]: number} = {};
  for (const node of ret2) {
    math.evaluate(`${node.name}=${node.formula}`, scope);
  }
  // eslint-disable-next-line no-underscore-dangle
  return scope.___temp___;
}

export class Formula implements IFormula {
  className = 'Formula';

  name: string;

  private _formula: string;

  readonly absPath: string;

  get formula(): string {
    return this._formula;
  }

  set formula(formula: string) {
    /* if (
      validate({
        ...this,
        formula
      }) === 'OK'
    ) */
    this._formula = formula;
  }

  get evaluatedValue(): number {
    return this.getEvaluatedValue(undefined);
  }

  getEvaluatedValue(formulae: IDataFormula[] | undefined): number {
    if (isNumber(this._formula)) {
      return Number(this._formula);
    }
    return evaluate(this._formula, formulae);
  }

  getData(): IDataFormula {
    return {name: this.name, formula: this.formula, absPath: this.absPath};
  }

  constructor(
    params:
      | {name: string; formula?: string | number; absPath?: string}
      | IDataFormula
      | string
  ) {
    const {name, formula, absPath} =
      typeof params !== 'string'
        ? params
        : {
            name: 'tempValue',
            formula: params,
            absPath: 'tempValue'
          };
    this.name = name;
    this._formula = '0';
    this.absPath = absPath ?? 'global';
    if (formula) {
      this._formula = formula.toString();
    }
  }

  copy(newAbsPath: string): Formula {
    return new Formula({
      name: this.name,
      formula: this.formula,
      absPath: newAbsPath
    });
  }
}

export const isFormula = (params: any): params is Formula => {
  try {
    return 'className' in params && params.className === 'Formula';
  } catch (e: any) {
    return false;
  }
};

export function getAllValiables(formulae: IDataFormula[]): {
  [name: string]: IFormula;
} {
  const tmp: {[name: string]: IFormula} = {};
  formulae.forEach((value) => {
    tmp[value.name] = new Formula(value);
  });
  return tmp;
}

function getNodesFromFormula(
  formula: IDataFormula,
  formulae: IDataFormula[]
): Node[] | FormulaError {
  try {
    // const allNames = formulae.map((formula) => formula.name);
    const endNode = getNode(formula);
    const nodes = getNodes(formulae);
    const names = [endNode.name];
    return getNodesFromNode(endNode, nodes, names);
  } catch (e) {
    return 'unknown valiable(s) are contained';
  }
}

function getNodesFromNode(root: Node, nodes: Nodes, names: string[]): Node[] {
  let ret: Node[] = [root];
  for (const name of root.nodes) {
    if (!names.includes(name)) {
      names.push(name);
      const node = nodes[name];
      ret = [...ret, ...getNodesFromNode(node, nodes, names)];
    }
  }
  return ret;
}
