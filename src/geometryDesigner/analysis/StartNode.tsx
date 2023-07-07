/* eslint-disable class-methods-use-this */
import {setAssembled} from '@store/reducers/uiTempGeometryDesigner';
import store from '@store/store';
import {Node as IRFNode} from 'reactflow';
import {v4 as uuidv4} from 'uuid';
import {IActionNode, IDataActionNode, ActionNode} from './ActionNode';
import {isDataFlowNode, IFlowNode, IDataFlowNode, IDataEdge} from './FlowNode';
import {ITest} from './ITest';

export const className = 'Start' as const;
type ClassName = typeof className;

export interface IStartNode extends IActionNode {
  className: ClassName;
}

export interface IDataStartNode extends IDataActionNode {
  className: ClassName;
}

export class StartNode extends ActionNode implements IStartNode {
  action(): void {
    const {dispatch} = store;
    dispatch(setAssembled(true));
  }

  readonly className = className;

  acceptable(): boolean {
    return false;
  }

  validate(
    edgesFromTarget: {[index: string]: IDataEdge | undefined},
    edgesFromSource: {[index: string]: IDataEdge[]}
  ): boolean {
    if (edgesFromSource[this.nodeID]?.length > 0) return true;
    return false;
  }

  getData(nodes: {[index: string]: IFlowNode | undefined}): IDataStartNode {
    const data = super.getData(nodes);
    return {...data, className: this.className};
  }

  getRFNode(test: ITest): IRFNode {
    const rfNode = super.getRFNode(test);
    return {
      ...rfNode,
      type: 'oval',
      data: {
        label: this.name,
        source: true
      }
    };
  }

  constructor(
    params: {name: string; position: {x: number; y: number}} | IDataStartNode
  ) {
    super(params);
    // eslint-disable-next-line no-empty
    if (isDataFlowNode(params) && isDataStartNode(params)) {
    }
  }

  clone(nodes: {[index: string]: IFlowNode | undefined}): IStartNode {
    return new StartNode({...this.getData(nodes), nodeID: uuidv4()});
  }
}

export function isStartNode(node: IFlowNode): node is IStartNode {
  return node.className === className;
}

export function isDataStartNode(node: IDataFlowNode): node is IDataStartNode {
  return node.className === className;
}
