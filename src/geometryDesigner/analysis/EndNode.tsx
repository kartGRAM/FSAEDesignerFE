/* eslint-disable class-methods-use-this */
import {Node as IRFNode} from 'reactflow';
import store from '@store/store';
import {v4 as uuidv4} from 'uuid';
import {OvalNodeProps} from '@gdComponents/side-panel-components/analysis/OvalNode';
import {IActionNode, IDataActionNode, ActionNode} from './ActionNode';
import {
  isDataFlowNode,
  IFlowNode,
  IDataFlowNode,
  IDataEdge,
  endNodeClassName
} from './FlowNode';
import {isCaseEndNode} from './TypeGuards';
import {ITest} from './ITest';

export const className = endNodeClassName;
type ClassName = typeof className;

export interface IEndNode extends IActionNode {
  className: ClassName;
}

export interface IDataEndNode extends IDataActionNode {
  className: ClassName;
}

export class EndNode extends ActionNode implements IEndNode {
  async action(): Promise<boolean> {
    const rootState = store.getState();
    const state = rootState.uitgd;
    const solver = state.kinematicSolver;
    if (!solver) {
      throw new Error('solver not found ( or solver not converged).');
    }
    await solver.wait();
    solver.postProcess();
    return false;
  }

  // eslint-disable-next-line no-empty-function
  async restore(): Promise<boolean> {
    return false;
  }

  readonly className = className;

  acceptable(
    node: IFlowNode,
    nodes: {[index: string]: IFlowNode | undefined},
    edges: {[index: string]: IDataEdge | undefined},
    edgesFromSource: {[index: string]: IDataEdge[]}
  ): boolean {
    if (!super.acceptable(node, nodes, edges, edgesFromSource)) return false;
    if (isCaseEndNode(node)) return true;
    return false;
  }

  validate(
    edgesFromTarget: {[index: string]: IDataEdge | undefined},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    edgesFromSource: {[index: string]: IDataEdge[]}
  ): boolean {
    if (edgesFromTarget[this.nodeID]) return true;
    return false;
  }

  getData(nodes: {[index: string]: IFlowNode | undefined}): IDataEndNode {
    const data = super.getData(nodes);
    return {...data, className: this.className};
  }

  getRFNode(test: ITest): IRFNode & OvalNodeProps {
    const rfNode = super.getRFNode(test);
    return {
      ...rfNode,
      type: 'oval',
      data: {...rfNode.data, source: true, target: true}
    };
  }

  constructor(
    params: {name: string; position: {x: number; y: number}} | IDataEndNode
  ) {
    super(params);
    // eslint-disable-next-line no-empty
    if (isDataFlowNode(params) && isDataEndNode(params)) {
    }
  }

  clone(nodes: {[index: string]: IFlowNode | undefined}): IEndNode {
    return new EndNode({...this.getData(nodes), nodeID: uuidv4()});
  }
}

export function isEndNode(node: IFlowNode): node is IEndNode {
  return node.className === className;
}

export function isDataEndNode(node: IDataFlowNode): node is IDataEndNode {
  return node.className === className;
}
