import {Node as IRFNode} from 'reactflow';
import {ITest} from '@gd/analysis/ITest';
import {IFlowNode} from '@gd/analysis/FlowNode';

export function getRFNodeBase(node: IFlowNode, parentTest?: ITest): IRFNode {
  const {position, selected} = node;
  let validated = true;
  if (parentTest) {
    validated = node.validate(
      parentTest.edgesFromTarget,
      parentTest.edgesFromSourceNode
    );
  }
  return {
    id: node.nodeID,
    position,
    data: {
      label: node.name,
      warning: !validated
    },
    selected
  };
}
