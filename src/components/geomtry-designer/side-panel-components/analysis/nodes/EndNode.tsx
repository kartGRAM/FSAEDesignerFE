import {OvalNodeProps} from '@gdComponents/side-panel-components/analysis/OvalNode';
import {Node as IRFNode} from 'reactflow';
import {ITest} from '@gd/analysis/ITest';
import {IEndNode, isEndNode} from '@gd/analysis/EndNode';
import {getRFNodeBase} from './Base';

export {isEndNode};

export function getRFNode(
  node: IEndNode,
  test?: ITest
): IRFNode & OvalNodeProps {
  const rfNode = getRFNodeBase(node, test);
  return {
    ...rfNode,
    type: 'oval',
    data: {...rfNode.data, source: true, target: true}
  };
}
