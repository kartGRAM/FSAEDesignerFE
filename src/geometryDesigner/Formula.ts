/* eslint-disable no-restricted-syntax */
import {
  IDataFormula,
  FormulaError,
  Node,
  Nodes,
  getNode,
  getNodes,
  isFormulaErrors,
  topologicalSort
} from '@gd/DataFormula';
import store from '@store/store';
import * as math from 'mathjs';

export interface IFormula {
  name: string;
  formula: string;
  readonly evaluatedValue: number;
  readonly absPath: string;
  getData(): IDataFormula;
}

export function validate(
  formula: IDataFormula,
  formulae?: IDataFormula[]
): FormulaError {
  try {
    if (!formulae) {
      formulae = store.getState().dgd.present.formulae;
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
    formulae = store.getState().dgd.present.formulae;
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
  name: string;

  private _formula: string;

  readonly absPath: string;

  get formula(): string {
    return this._formula;
  }

  set formula(formula: string) {
    if (
      validate({
        ...this,
        formula
      }) === 'OK'
    )
      this._formula = formula;
  }

  get evaluatedValue(): number {
    return evaluate(this._formula);
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
