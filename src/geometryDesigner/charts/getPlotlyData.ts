import {CaseResults} from '@worker/solverWorkerMessage';
import {KinematicSolver} from '@gd/kinematics/Solver';
import {IAssembly} from '@gd/IElements';
import {evaluate} from '@gd/Formula';
import {DatumManager} from '@gd/measure/DatumManager';
import {MeasureToolsManager} from '@gd/measure/MeasureToolsManager';
import {IChartData, DataRef, IPlotData, Datum, getStats} from './ICharts';

export function getPlotlyData(
  data: IChartData,
  caseResults: CaseResults,
  solver: KinematicSolver,
  assembly: IAssembly,
  datumManager: DatumManager,
  measureToolsManager: MeasureToolsManager
): IPlotData {
  const {x, y, z} = data;
  return {
    ...data,
    x: getDataArray(
      x,
      caseResults,
      solver,
      assembly,
      datumManager,
      measureToolsManager
    ),
    y: getDataArray(
      y,
      caseResults,
      solver,
      assembly,
      datumManager,
      measureToolsManager
    ),
    z: z
      ? getDataArray(
          z,
          caseResults,
          solver,
          assembly,
          datumManager,
          measureToolsManager
        )
      : z
  };
}

// eslint-disable-next-line consistent-return
export function getDataArray(
  ref: DataRef,
  caseResults: CaseResults,
  solver: KinematicSolver,
  assembly: IAssembly,
  datumManager: DatumManager,
  measureToolsManager: MeasureToolsManager
): Datum[] {
  if (ref.stats) {
    const stats = getStats(ref.stats);
    const cases = Object.keys(caseResults.caseResults);
    return cases.map((c) => {
      const datum = getDataArray(
        {...ref, case: c},
        caseResults,
        solver,
        assembly,
        datumManager,
        measureToolsManager
      );
      return stats(datum as number[]);
    });
  }
  const results =
    ref.case !== 'All'
      ? caseResults.caseResults[ref.case]
      : Object.values(caseResults.caseResults).flat();
  // eslint-disable-next-line default-case
  switch (ref.from) {
    case 'element':
      return results.map((result) => {
        solver.restoreState(result);
        solver.postProcess();
        const vars = assembly.getVariablesAll();
        const v = vars.find((p) => p.nodeID === ref.nodeID);
        return v?.value ?? Number.NaN;
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
      if (ref.nodeID === 'case') return Object.keys(caseResults.caseResults);
      return [0];
  }
}
