import {ITest} from '@gd/analysis/ITest';
import {IFlowNode} from '@gd/analysis/FlowNode';
import {Node as IRFNode} from 'reactflow';

export function getRFNodeBase(node: IFlowNode, parentTest?: ITest): IRFNode {
  const {position, selected} = node;
  let validated = true;
  let completed = false;
  let error = false;
  if (parentTest) {
    validated = node.validate(
      parentTest.edgesFromTarget,
      parentTest.edgesFromSourceNode
    );
    completed = parentTest.solver.isNodeDone(node.nodeID);
    error = parentTest.solver.isNodeError(node.nodeID);
  }
  return {
    id: node.nodeID,
    position,
    data: {
      label: node.name,
      warning: !validated,
      completed,
      error
    },
    selected
  };
}
