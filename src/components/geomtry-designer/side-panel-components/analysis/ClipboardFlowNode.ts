import IClipboardItem, {isClipboardItem} from '@gd/ClipboardItem';
import {Node, Edge} from 'reactflow';
import {getFlowNode} from '@gd/analysis/RestoreData';
import {IDataEdge, IFlowNode} from '@gd/analysis/FlowNode';
import {IClipboardFlowNodes, isClipboardFlowNodes} from '@gd/analysis/ITest';
import {getEdge, getRFNode} from './nodes/getItems';

export function getFlowNodesFromClipboard(
  item: IClipboardFlowNodes,
  testNodes: {[index: string]: IFlowNode | undefined},
  testID: string
): {
  nodes: IFlowNode[];
  edges: IDataEdge[];
} {
  const nodes = item.nodes.map((node) => getFlowNode(node, testID));
  nodes.forEach((node) => {
    if (node.copyFrom && node.setCopyFrom) {
      const org = testNodes[node.copyFrom ?? ''];
      node.setCopyFrom(org ?? null);
    }
  });
  return {
    nodes,
    edges: item.edges
  };
}

export function getRFFlowNodesFromClipboard(
  item: IClipboardFlowNodes,
  testNodes: {[index: string]: IFlowNode | undefined},
  testID: string
): {
  nodes: Node[];
  edges: Edge[];
} {
  const {nodes, edges} = getFlowNodesFromClipboard(item, testNodes, testID);
  return {
    nodes: nodes.map((node) => getRFNode(node)),
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
