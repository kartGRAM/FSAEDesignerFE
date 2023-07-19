import {Edge, MarkerType, Node as IRFNode} from 'reactflow';
import {IDataEdge, IFlowNode, Item} from '@gd/analysis/FlowNode';
import {ITest} from '@gd/analysis/ITest';
import {isStartNode, getRFNode as startRF} from './StartNode';
import {isEndNode, getRFNode as endRF} from './EndNode';
import {
  isCaseStartNode,
  getRFNode as caseStartRF,
  getItem as caseStartGI
} from './CaseStartNode';
import {
  isCaseEndNode,
  getRFNode as caseEndRF,
  getItem as caseEndGI
} from './CaseEndNode';
import {
  isSetterNode,
  getRFNode as setterRF,
  getItem as setterGI
} from './SetterNode';
import {
  isSweepNode,
  getRFNode as sweepRF,
  getItem as sweepGI
} from './SweepNode';
import {
  isChartNode,
  getRFNode as chartRF,
  getItem as chartGI
} from './ChartNode';

export function getRFNode(
  node: IFlowNode,
  test?: ITest,
  canvasUpdate?: () => void
): IRFNode {
  if (isStartNode(node)) return startRF(node, test);
  if (isEndNode(node)) return endRF(node, test);
  if (isCaseStartNode(node)) return caseStartRF(node, test, canvasUpdate);
  if (isCaseEndNode(node)) return caseEndRF(node, test);
  if (isSetterNode(node)) return setterRF(node, test, canvasUpdate);
  if (isSweepNode(node)) return sweepRF(node, test, canvasUpdate);
  if (isChartNode(node)) return chartRF(node, test, canvasUpdate);
  throw new Error('未実装のnode');
}

export function getItems(): (Item | 'divider')[] {
  return [
    caseStartGI(),
    caseEndGI(),
    'divider',
    setterGI(),
    sweepGI(),
    'divider',
    chartGI()
  ];
}

export function getEdge(edge: IDataEdge): Edge {
  if (edge.className === 'default') {
    return {
      ...edge,
      type: 'default',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edge.selected ? '#333' : '#999'
      },
      style: {strokeWidth: 4, stroke: edge.selected ? '#333' : '#999'}
    };
  }
  throw new Error('未実装のedge');
}
