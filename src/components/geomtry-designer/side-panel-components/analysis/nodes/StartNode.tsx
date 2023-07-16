import {OvalNodeProps} from '@gdComponents/side-panel-components/analysis/OvalNode';
import {Node as IRFNode} from 'reactflow';
import {ITest} from '@gd/analysis/ITest';
import {StartNode} from '@gd/analysis/StartNode';
import {getRFNodeBase} from './Base';

export function getRFNode(
  node: StartNode,
  test: ITest
): IRFNode & OvalNodeProps {
  const rfNode = getRFNodeBase(node, test);
  return {
    ...rfNode,
    type: 'oval',
    data: {
      ...rfNode.data,
      label: node.name,
      source: true
    }
  };
}
