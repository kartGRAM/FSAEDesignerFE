import {CaseResults} from '@worker/solverWorkerMessage';
import {getAssembly} from '@gd/Elements';
import {IChartData, DataRef, IPlotData, Datum} from './ICharts';

export function getPlotlyData(
  data: IChartData,
  caseResults: CaseResults
): IPlotData {
  const {x, y, z} = data;
  return {
    ...data,
    x: getDataArray(x, caseResults),
    y: getDataArray(y, caseResults),
    z: z ? getDataArray(z, caseResults) : z
  };
}

export function getDataArray(ref: DataRef, caseResults: CaseResults): Datum[] {
  const results =
    ref.case !== 'All'
      ? caseResults.caseResults[ref.case]
      : Object.values(caseResults.caseResults).flat();
  // eslint-disable-next-line default-case
  switch (ref.from) {
    case 'element':
      return results.map((result) => {
        const measurablePoints = getAssembly(
          result.assemblyData
        ).getMeasurablePoints();
        const p = measurablePoints.find((p) => p.nodeID === ref.nodeID);
        return p?.value.x ?? Number.NaN;
      });
    case 'control':
      break;
    case 'global':
      break;
    case 'measureTool':
      break;
    case 'special':
      break;
  }
}
