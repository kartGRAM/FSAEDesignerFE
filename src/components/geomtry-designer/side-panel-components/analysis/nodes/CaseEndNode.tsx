import {CircleNodeProps} from '@gdComponents/side-panel-components/analysis/CircleNode';
import {Node as IRFNode} from 'reactflow';
import {ITest} from '@gd/analysis/ITest';
import {
  className,
  ICaseEndNode,
  CaseEndNode,
  isCaseEndNode
} from '@gd/analysis/CaseEndNode';
import {Item, XYPosition} from '@gd/analysis/FlowNode';
import CaseEnd from '@gdComponents/svgs/CaseEnd';
import {getRFNodeBase} from './Base';

export {isCaseEndNode};

export function getRFNode(
  node: ICaseEndNode,
  test?: ITest
): IRFNode & CircleNodeProps {
  const rfNode = getRFNodeBase(node, test);
  return {
    ...rfNode,
    type: 'circle',
    data: {
      ...rfNode.data,
      icon: <CaseEnd title={node.name} />
    }
  };
}

export function getItem(): Item {
  return {
    className,
    icon: <CaseEnd title="Case End" />,
    text: 'Case end',
    onDrop: (position: XYPosition, temporary: boolean) =>
      new CaseEndNode({
        name: 'Case end',
        position,
        nodeID: temporary ? 'temp' : undefined
      })
  };
}
