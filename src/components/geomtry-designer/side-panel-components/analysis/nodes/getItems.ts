import {Edge, MarkerType} from 'reactflow';
import {IDataEdge} from '@gd/analysis/FlowNode';

export function getItems(): (Item | 'divider')[] {
  return [
    CaseStartNode.getItem(),
    CaseEndNode.getItem(),
    'divider',
    SetterNode.getItem(),
    SweepNode.getItem()
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
