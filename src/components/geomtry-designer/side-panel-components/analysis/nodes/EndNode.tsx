import {OvalNodeProps} from '@gdComponents/side-panel-components/analysis/OvalNode';
import {Node as IRFNode} from 'reactflow';
import {ITest} from '@gd/analysis/ITest';
import {EndNode} from '@gd/analysis/EndNode';
import {getRFNodeBase} from './Base';

export function getRFNode(node: EndNode, test: ITest): IRFNode & OvalNodeProps {
  const rfNode = getRFNodeBase(node, test);
  return {
    ...rfNode,
    type: 'oval',
    data: {...rfNode.data, source: true, target: true}
  };
}
