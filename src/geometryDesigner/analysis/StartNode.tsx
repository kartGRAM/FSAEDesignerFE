/* eslint-disable class-methods-use-this */
import {setAssembled} from '@store/reducers/uiTempGeometryDesigner';
import store from '@store/store';
import {Node as IRFNode} from 'reactFlow';
import {IActionNode, IDataActionNode, ActionNode} from './ActionNode';
import {isDataFlowNode, IFlowNode, IDataFlowNode} from './FlowNode';

const className = 'Start' as const;
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

  getData(): IDataStartNode {
    const data = super.getData();
    return {...data, className: this.className};
  }

  getRFNode(): IRFNode {
    const rfNode = super.getRFNode();
    return {...rfNode, data: this.name};
  }

  constructor(
    params: {name: string; position: {x: number; y: number}} | IDataStartNode
  ) {
    super(params);
    // eslint-disable-next-line no-empty
    if (isDataFlowNode(params) && isDataStartNode(params)) {
    }
  }
}

export function isStartNode(node: IFlowNode): node is IStartNode {
  return node.className === className;
}

export function isDataStartNode(node: IDataFlowNode): node is IDataStartNode {
  return node.className === className;
}
