import {v4 as uuidv4} from 'uuid';
import {isEndNode} from './TypeGuards';
import {
  IFlowNode,
  isDataFlowNode,
  IDataFlowNode,
  IDataEdge,
  FlowNode
} from './FlowNode';

export const className = 'Chart' as const;
type ClassName = typeof className;

export interface IChartNode extends IFlowNode {
  className: ClassName;
}

export interface IDataSetterNode extends IDataFlowNode {
  className: ClassName;
}

export class ChartNode extends FlowNode implements IChartNode {
  readonly className = className;

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

  getData(nodes: {[index: string]: IFlowNode | undefined}): IDataSetterNode {
    const data = super.getData(nodes);
    return {
      ...data,
      className: this.className
    };
  }

  constructor(
    params:
      | {
          name: string;
          position: {x: number; y: number};
          nodeID?: string;
        }
      | IDataSetterNode
  ) {
    super(params);
    if (isDataFlowNode(params) && isDataChartNode(params)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const data = params;
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

export function isDataChartNode(node: IDataFlowNode): node is IDataSetterNode {
  return node.className === className;
}
