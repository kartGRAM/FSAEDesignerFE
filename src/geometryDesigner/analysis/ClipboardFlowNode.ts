import IClipboardItem, {isClipboardItem} from '@gd/ClipboardItem';
import {Node, Edge} from 'reactflow';
import {getEdge, getFlowNode} from '@gd/analysis/RestoreData';
import {IDataFlowNode, IDataEdge, IFlowNode} from './FlowNode';

export interface IClipboardFlowNodes extends IClipboardItem {
  isClipboardFlowNodes: true;
  nodes: IDataFlowNode[];
  edges: IDataEdge[];
}

export function isClipboardFlowNodes(
  item: IClipboardItem
): item is IClipboardFlowNodes {
  return (item as IClipboardFlowNodes).isClipboardFlowNodes;
}

export function getFlowNodesFromClipboard(item: IClipboardFlowNodes): {
  nodes: IFlowNode[];
  edges: IDataEdge[];
} {
  return {
    nodes: item.nodes.map((node) => getFlowNode(node)),
    edges: item.edges
  };
}

export function getRFFlowNodesFromClipboard(item: IClipboardFlowNodes): {
  nodes: Node[];
  edges: Edge[];
} {
  const {nodes, edges} = getFlowNodesFromClipboard(item);
  return {
    nodes: nodes.map((node) => node.getRFNode()),
    edges: edges.map((edge) => getEdge(edge))
  };
}

export function getJsonFromClipboardFlowNodes(
  item: IClipboardFlowNodes
): string {
  return JSON.stringify(item);
}

export function convertJsonToClipboardFlowNodes(
  content: string
): IClipboardFlowNodes | null {
  try {
    const data = JSON.parse(content) as IClipboardItem;
    if (isClipboardItem(data) && isClipboardFlowNodes(data)) return data;
    return null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return null;
  }
}
