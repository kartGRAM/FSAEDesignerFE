import {IFlowNode} from './FlowNode';

export interface ICaseStartNode extends IFlowNode {
  className: 'CaseStart';
}

export interface ICaseEndNode extends IFlowNode {
  className: 'CaseEnd';
}
