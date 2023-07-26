import {v4 as uuidv4} from 'uuid';
import {IChartData, IChartLayout, IPlotData} from '@gd/charts/ICharts';
import {getPlotlyData} from '@gd/charts/getPlotlyData';
import {isEndNode} from './TypeGuards';
import {
  IFlowNode,
  isDataFlowNode,
  IDataFlowNode,
  IDataEdge,
  FlowNode
} from './FlowNode';
import {ITest} from './ITest';

export const className = 'Chart' as const;
type ClassName = typeof className;

export interface IChartNode extends IFlowNode {
  className: ClassName;
  data: IChartData[];
  getPlotlyData(test: ITest): IPlotData[];
  layout: IChartLayout;
}

export interface IDataChartNode extends IDataFlowNode {
  className: ClassName;
  readonly data: IChartData[];
  readonly layout: IChartLayout;
}

export class ChartNode extends FlowNode implements IChartNode {
  readonly className = className;

  data: IChartData[] = [];

  plotlyData: IPlotData[] | undefined = undefined;

  getPlotlyData(test: ITest): IPlotData[] {
    if (this.plotlyData) return this.plotlyData;
    const instances = test.localInstances;
    const results = test.caseResults;
    if (!instances || !results) throw new Error('解析が終わっていない');
    this.plotlyData = this.data.map((data) =>
      getPlotlyData(data, results, instances)
    );
    return this.plotlyData;
  }

  layout: IChartLayout = {};

  acceptable(
    node: IFlowNode,
    nodes: {[index: string]: IFlowNode | undefined},
    edges: {[index: string]: IDataEdge | undefined},
    edgesFromSource: {[index: string]: IDataEdge[]}
  ): boolean {
    if (!super.acceptable(node, nodes, edges, edgesFromSource)) return false;
    if (isEndNode(node)) return true;
    return false;
  }

  validate(edgesFromTarget: {[index: string]: IDataEdge | undefined}): boolean {
    if (edgesFromTarget[this.nodeID]) return true;
    return false;
  }

  getData(nodes: {[index: string]: IFlowNode | undefined}): IDataChartNode {
    const data = super.getData(nodes);
    return {
      ...data,
      className: this.className,
      data: [...this.data],
      layout: {...this.layout}
    };
  }

  constructor(
    params:
      | {
          name: string;
          position: {x: number; y: number};
          nodeID?: string;
        }
      | IDataChartNode
  ) {
    super(params);
    if (isDataFlowNode(params) && isDataChartNode(params)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const data = params;
      this.data = data.data;
      this.layout = data.layout;
    }
  }

  clone(nodes: {[index: string]: IFlowNode | undefined}): IChartNode {
    const ret = new ChartNode({...this.getData(nodes), nodeID: uuidv4()});
    return ret;
  }
}

export function isChartNode(node: IFlowNode): node is IChartNode {
  return node.className === className;
}

export function isDataChartNode(node: IDataFlowNode): node is IDataChartNode {
  return node.className === className;
}
