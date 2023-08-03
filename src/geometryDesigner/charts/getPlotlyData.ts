import {CaseResults} from '@worker/solverWorkerMessage';
import {evaluate} from '@gd/Formula';
import {LocalInstances} from '@worker/getLocalInstances';
import {INamedNumberRO, isNamedVector3RO} from '@gd/INamedValues';
import {isElement, IElement} from '@gd/IElements';
import {IChartData, DataRef, IPlotData, Datum, getStats} from './ICharts';

export function getPlotlyData(
  data: IChartData,
  caseResults: CaseResults,
  localInstances: LocalInstances
): IPlotData {
  const {x, y, z} = data;
  return {
    ...data,
    x: getDataArray(x, caseResults, localInstances),
    y: getDataArray(y, caseResults, localInstances),
    z: getDataArray(z, caseResults, localInstances)
  };
}

// eslint-disable-next-line consistent-return
export function getDataArray(
  ref: DataRef,
  caseResults: CaseResults,
  localInstances: LocalInstances
): Datum[] {
  const {assembly, datumManager, measureToolsManager, solver} = localInstances;
  if (ref.stats) {
    const stats = getStats(ref.stats);
    const cases = Object.keys(caseResults.cases);
    return cases.map((c) => {
      const datum = getDataArray(
        {...ref, case: c},
        caseResults,
        localInstances
      );
      return stats(datum as number[]);
    });
  }
  const results =
    ref.case !== 'All'
      ? caseResults.cases[ref.case]?.results
      : Object.values(caseResults.cases)
          .map((c) => c.results)
          .flat();
  if (!results) return [];
  let element: IElement | undefined;
  // eslint-disable-next-line default-case
  switch (ref.from) {
    case 'element':
      return results.map((result) => {
        solver.restoreState(result);
        solver.postProcess();
        if (!element) {
          const vars = assembly.getVariablesAllWithParentFlat();
          const v = vars.find((p) => p.value.nodeID === ref.nodeID);
          element = v?.parent;
          return getMappedNumber(v?.value);
        }
        const vars = element.getVariables();
        const v = vars.find((p) => p.nodeID === ref.nodeID);
        return getMappedNumber(v);
      });
    case 'global':
      return results.map((result) => {
        const v = result.globals.find((g) => g.name === ref.nodeID);
        return v ? evaluate(v.formula) : Number.NaN;
      });
    case 'measureTool':
      return results.map((result) => {
        solver.restoreState(result);
        solver.postProcess();
        datumManager.update();
        measureToolsManager.update();
        const [nodeID, value] = ref.nodeID.split('.');
        const tool = measureToolsManager.getMeasureTool(nodeID);
        return tool?.value[value] ?? Number.NaN;
      });
    case 'special':
      if (ref.nodeID === 'cases') return Object.keys(caseResults.cases);
      return [];
  }
}

export type SelectableDataCategory = {
  [index: string]:
    | {nodeID: string; name: string; categoryName: string}[]
    | SelectableDataCategory;
};

export type SelectableData = {
  [key in DataRef['from']]:
    | {nodeID: string; name: string; categoryName: string}[]
    | SelectableDataCategory;
};

export function getCases(
  caseResults: CaseResults
): {nodeID: string; name: string; categoryName: string}[] {
  return [
    {
      nodeID: 'All',
      name: 'All',
      categoryName: 'cases'
    },
    ...Object.keys(caseResults.cases).map((key) => ({
      nodeID: key,
      name: caseResults.cases[key].name,
      categoryName: 'cases'
    }))
  ];
}

export function getSelectableData(
  caseResults: CaseResults,
  localInstances: LocalInstances
): SelectableData {
  const result = Object.values(caseResults.cases).pop()?.results[0];
  if (!result)
    return {
      element: [],
      global: [],
      measureTool: [],
      special: []
    };

  return {
    element: localInstances.assembly
      .getVariablesAllWithParent()
      .reduce((prev, current) => {
        prev[current.parent.nodeID] = current.values.map((v) => ({
          nodeID: v.nodeID,
          name: v.name,
          categoryName: current.parent.name.value
        }));
        return prev;
      }, {} as SelectableDataCategory),
    global: result.globals.map((global) => ({
      nodeID: global.name,
      name: global.name,
      categoryName: 'global'
    })),
    measureTool: localInstances.measureToolsManager.children.map((child) => ({
      nodeID: child.nodeID,
      name: child.name,
      categoryName: 'measureTool'
    })),
    special: {
      cases: getCases(caseResults)
    }
  };
}

export function getMappedNumber(value: INamedNumberRO | undefined): number {
  if (!value) return Number.NaN;
  const vector = value.parent;
  if (isNamedVector3RO(vector) && isElement(vector.parent)) {
    const element = vector.parent;
    const q = element.rotation.value;
    const p = element.position.value;
    const xyz = value.nodeID.slice(-1);
    switch (xyz) {
      case 'x':
        return vector.value.applyQuaternion(q).add(p).x;
      case 'y':
        return vector.value.applyQuaternion(q).add(p).y;
      case 'z':
        return vector.value.applyQuaternion(q).add(p).z;
      default:
        throw new Error('末尾がxyzでない');
    }
  }
  return value.value;
}
