import * as math from 'mathjs';
import {isObject} from '@utils/helpers';

export interface IDataFormula {
  name: string;
  formula: string;
  readonly absPath: string;
}

export interface IFormula {
  className: 'Formula';
  name: string;
  formula: string;
  get evaluatedValue(): number;
  readonly absPath: string;
  getData(): IDataFormula;
  copy(newAbsPath: string): IFormula;

  getEvaluatedValue(formulae: IDataFormula[] | undefined): number;
}

export const isFormula = (formula: any): formula is IFormula => {
  return isObject(formula) && formula.className === 'Formula';
};

export function replaceVariable(
  formula: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  replacement: string
): string {
  return formula;
}

export function validateAll(formulae: IDataFormula[]): FormulaError {
  try {
    if (dupricatedNames(formulae)) {
      return 'duplicated name';
    }
    const ret = topologicalSort(formulae);
    if (isFormulaErrors(ret)) return ret;

    try {
      const scope: object = {};
      for (const node of ret) {
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
}

function dupricatedNames(formulae: IDataFormula[]): boolean {
  const names = formulae.map((formula) => formula.name);
  const namesDropped = names.filter((x, i, self) => self.indexOf(x) === i);
  return names.length !== namesDropped.length;
}

const FormulaErrors = [
  'OK',
  'duplicated name',
  'unknown valiable(s) are contained',
  'circular reference',
  'invalid formula(e)',
  'unexpected error'
] as const;

export type FormulaError = typeof FormulaErrors[number];
export function isFormulaErrors(
  maybeFormulaError: unknown
): maybeFormulaError is FormulaError {
  return (
    typeof maybeFormulaError === 'string' &&
    FormulaErrors.includes(maybeFormulaError as FormulaError)
  );
}

export function getAllEvaluatedValue(formulae: IDataFormula[]) {
  const ret = topologicalSort(formulae) as Node[];
  const scope: {[key: string]: number} = {};
  for (const node of ret) {
    math.evaluate(`${node.name}=${node.formula}`, scope);
  }
  return scope;
}

export interface Node extends IDataFormula {
  nodes: string[];
  indegree: number;
}

export type Nodes = {[name: string]: Node};

export const mathFunctions = [
  'abs',
  'acos',
  'acosh',
  'asin',
  'asinh',
  'atan',
  'atan2',
  'atanh',
  'cbrt',
  'ceil',
  'clz32',
  'cos',
  'cosh',
  'E',
  'exp',
  'expm1',
  'floor',
  'fround',
  'hypot',
  'imul',
  'LN10',
  'LN2',
  'log',
  'log10',
  'LOG10E',
  'log1p',
  'log2',
  'LOG2E',
  'Math',
  'max',
  'min',
  'PI',
  'pow',
  'random',
  'round',
  'sign',
  'sin',
  'sinh',
  'sqrt',
  'SQRT1_2',
  'SQRT2',
  'tan',
  'tanh',
  'trunc',
  'e',
  'v',
  'w'
];

function getNamesFromFormula(formula: string): string[] {
  const names: string[] = [
    ...new Set(formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) ?? [])
  ];
  const namesWOMathFunc = names.filter((name) => !mathFunctions.includes(name));

  return namesWOMathFunc;
}

export function hasName(formula: string, name: string): boolean {
  const re1 = new RegExp(`[^a-zA-Z_]+[0-9]*${name}[^a-zA-Z0-9_]+`, '');
  const re2 = new RegExp(`^${name}[^a-zA-Z0-9_]+`, '');
  const re3 = new RegExp(`[^a-zA-Z_]+[0-9]*${name}$`, '');
  const re4 = new RegExp(`^${name}$`, '');
  const ret =
    formula.match(re1) ||
    formula.match(re2) ||
    formula.match(re3) ||
    formula.match(re4);
  return !!ret;
}

export function replaceName(
  formula: string,
  name: string,
  newName: string
): string {
  let re = new RegExp(`^${name}([^a-zA-Z0-9_]+)`, '');
  let ret = formula.replace(re, `${newName}$1`);
  re = new RegExp(`([^a-zA-Z_]+[0-9]*)${name}$`, '');
  ret = ret.replace(re, `$1${newName}`);
  re = new RegExp(`^${name}$`, '');
  ret = ret.replace(re, `${newName}`);
  re = new RegExp(`([^a-zA-Z_]+[0-9]*)${name}([^a-zA-Z0-9_]+)`, 'g');
  let retOld = ret;
  // eslint-disable-next-line no-cond-assign
  while (retOld !== (ret = ret.replace(re, `$1${newName}$2`))) retOld = ret;
  return ret;
}

export function getNode(formula: IDataFormula): Node {
  const names = getNamesFromFormula(formula.formula);
  return {nodes: names, indegree: names.length, ...formula};
}

export function getNodes(formulae: IDataFormula[]): Nodes {
  const nodes: Nodes = {};
  // const names = formulae.map((formula) => formula.name);
  formulae.forEach((formula) => {
    nodes[formula.name] = getNode(formula);
  });
  return nodes;
}

function get0DegreeNodes(nodes: Nodes): Node[] {
  const arrNodes = Object.values(nodes);
  return arrNodes.filter((node) => node.indegree === 0);
}

export function topologicalSort(
  formulae: IDataFormula[]
): Node[] | FormulaError {
  try {
    const nodes = getNodes(formulae);
    const q = get0DegreeNodes(nodes);
    // トポロジカルソートを行う
    let cnt: number = 0;
    const topOrder: Node[] = [];
    while (q.length !== 0) {
      const node0 = q.shift()!;
      topOrder.push(node0);

      for (const node of Object.values(nodes)) {
        if (node.nodes.includes(node0.name) && --node.indegree === 0) {
          q.push(node);
        }
      }
      ++cnt;
    }
    if (cnt !== Object.keys(nodes).length) {
      return 'circular reference';
    }
    return topOrder;
  } catch (e) {
    return 'unknown valiable(s) are contained';
  }
}
