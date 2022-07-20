/* eslint-disable no-restricted-syntax */
import * as math from 'mathjs';

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
    } catch (e) {
      return 'invalid formula(e)';
    }
  } catch (e) {
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

export interface Node extends IDataFormula {
  nodes: string[];
  indegree: number;
}

export type Nodes = {[name: string]: Node};

export function getNode(formula: IDataFormula): Node {
  const names = getNamesFromFormula(formula.formula) ?? [];
  return {nodes: names, indegree: names.length, ...formula};
}

export function getNodes(formulae: IDataFormula[]): Nodes {
  const nodes: Nodes = {};
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

function getNamesFromFormula(formula: string): string[] | null {
  return formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g);
}
