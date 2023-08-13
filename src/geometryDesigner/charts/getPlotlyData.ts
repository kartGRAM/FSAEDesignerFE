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
  const ret = {
    ...data,
    x: getDataArray(x, caseResults, localInstances),
    y: getDataArray(y, caseResults, localInstances),
    z: getDataArray(z, caseResults, localInstances)
  };
  return ret;
}

// eslint-disable-next-line consistent-return
export function getDataArray(
  ref: DataRef,
  caseResults: CaseResults,
  localInstances: LocalInstances
): Datum[] {
  const {assembly, solver} = localInstances;
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
  let idx = -1;
  // eslint-disable-next-line default-case
  switch (ref.from) {
    case 'element':
      return results.map((result) => {
        solver.restoreState(result);
        solver.postProcess();
        if (!element || idx === -1) {
          const vars = assembly.getVariablesAllWithParentFlat();
          const v = vars.find((p) => p.value.nodeID === ref.nodeID);
          element = v?.parent;
          if (element) {
            idx = element
              .getVariables()
              .findIndex((p) => p.nodeID === ref.nodeID);
          }
          return getMappedNumber(v?.value);
        }
        const v = element.getVariables()[idx];
        return getMappedNumber(v);
      });
    case 'global':
      return results.map((result) => {
        const v = result.globals.find((g) => g.name === ref.nodeID);
        return v ? evaluate({formula: v.formula}) : Number.NaN;
      });
    case 'measureTool':
      return results.map((result) => {
        const [nodeID, value] = ref.nodeID.split('.');
        const tool = result.measureTools[nodeID];
        return tool?.values[value] ?? Number.NaN;
      });
    case 'readonlyVariable':
      return results.map((result) => {
        const variable = result.readonlyVariables[ref.nodeID];
        return variable?.value ?? Number.NaN;
      });
    case 'special':
      if (ref.nodeID === 'cases') return Object.keys(caseResults.cases);
      return [];
  }
}

export function getCases(
  caseResults: CaseResults
): {nodeID: string; name: string}[] {
  return [
    {
      nodeID: 'All',
      name: 'All'
    },
    ...Object.keys(caseResults.cases).map((key) => ({
      nodeID: key,
      name: caseResults.cases[key].name
    }))
  ];
}

export interface SelectableDataCategory {
  name: string;
  nodeID: string;
  children?: SelectableDataCategory[];
}

export function getSelectableData(
  caseResults: CaseResults,
  localInstances: LocalInstances
): SelectableDataCategory {
  const result = Object.values(caseResults.cases).pop()?.results[0];
  if (!result)
    return {
      name: 'root',
      nodeID: 'root',
      children: [
        {name: 'element', nodeID: 'element', children: []},
        {name: 'global', nodeID: 'global', children: []},
        {name: 'measureTool', nodeID: 'measureTool', children: []},
        {name: 'special', nodeID: 'special', children: []}
      ]
    };

  return {
    name: 'root',
    nodeID: 'root',
    children: [
      {
        name: 'element',
        nodeID: 'element',
        children: localInstances.assembly
          .getVariablesAllWithParent()
          .map((v) => ({
            name: v.parent.name.value,
            nodeID: v.parent.nodeID,
            children: v.values.map((value) => ({
              name: value.name,
              nodeID: value.nodeID
            }))
          }))
      },
      {
        name: 'global',
        nodeID: 'global',
        children: result.globals.map((global) => ({
          nodeID: global.name,
          name: global.name
        }))
      },
      {
        name: 'measureTool',
        nodeID: 'measureTool',
        children: localInstances.measureToolsManager.children.map((child) => {
          if (Object.keys(child.value).length === 1) {
            return {
              nodeID: `${child.nodeID}._`,
              name: child.name
            };
          }
          return {
            nodeID: child.nodeID,
            name: child.name,
            children: Object.keys(child.value).map((key) => ({
              nodeID: `${child.nodeID}.${key}`,
              name: key
            }))
          };
        })
      },
      {
        name: 'readonlyVariable',
        nodeID: 'readonlyVariable',
        children: localInstances.roVariablesManager.children.map((child) => ({
          nodeID: child.nodeID,
          name: child.name
        }))
      },
      {
        name: 'special',
        nodeID: 'special',
        children: [
          {
            name: 'cases',
            nodeID: 'cases',
            children: getCases(caseResults)
          }
        ]
      }
    ]
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
