/* eslint-disable class-methods-use-this */
import {setAssembled} from '@store/reducers/uiTempGeometryDesigner';
import store from '@store/store';
import {Node as IRFNode} from 'reactflow';
import {v4 as uuidv4} from 'uuid';
import {OvalNodeProps} from '@gdComponents/side-panel-components/analysis/OvalNode';
import {sleep} from '@utils/helpers';
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
  async action(): Promise<boolean> {
    const {dispatch} = store;
    dispatch(setAssembled(true));
    let state = store.getState().uitgd;
    while (!state.kinematicSolver && state.gdSceneState.assembled) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(10);
      state = store.getState().uitgd;
    }
    const solver = state.kinematicSolver;
    if (!solver) {
      throw new Error('solver not found ( or solver not converged).');
    }
    await solver.wait();
    solver.restoreInitialQ();
    await solver.wait();
    return false;
  }

  async restore(): Promise<boolean> {
    const state = store.getState().uitgd;
    const solver = state.kinematicSolver;
    if (!solver) {
      throw new Error('solver not found ( or solver not converged).');
    }
    await solver.wait();
    solver.restoreInitialQ();
    return false;
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

  getRFNode(test: ITest): IRFNode & OvalNodeProps {
    const rfNode = super.getRFNode(test);
    return {
      ...rfNode,
      type: 'oval',
      data: {
        ...rfNode.data,
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
