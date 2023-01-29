import {IFlowNode, IDataEdge} from './FlowNode';
import {
  isCaseStartNode,
  isCaseEndNode,
  isStartNode,
  isEndNode
} from './TypeGuards';

type TargetNodeID = string;
type SourceNodeID = string;
export default function validateGraph(
  nodes: {[index: string]: IFlowNode | undefined},
  edgesFromTarget: {[index: TargetNodeID]: IDataEdge | undefined},
  edgesFromSource: {[index: SourceNodeID]: IDataEdge[]}
): boolean {
  const vNodes = Object.values(nodes);
  const caseStartNodes = vNodes.filter((node) => isCaseStartNode(node!));
  const caseEndNodes = vNodes.filter((node) => isCaseEndNode(node!));

  for (const node of caseStartNodes) {
    // caseStartはCaseEndNodeに到達するまでに子に複数の枝を持ってはいけない
    let parent = node;
    while (parent) {
      // Caseが終わったらそこまで
      if (isCaseEndNode(parent)) break;
      // CaseEndNodeなしにEndNodeへ到達したのでおかしい
      if (isEndNode(parent)) return false;
      const edges = edgesFromSource[parent.nodeID];
      // まだ途中ならチェック終了
      if (edges.length === 0) break;
      // 複数の枝を持っていたらNG
      if (edges.length > 1) return false;
      parent = nodes[edges[0].target];
    }
    // caseStartNodeは祖先にCaseStartNodeを持ってはいけない
    parent = node;
    while (parent) {
      if (isCaseEndNode(parent)) break;
      if (parent !== node && isCaseStartNode(parent)) return false;
      const edge = edgesFromTarget[parent.nodeID];
      parent = nodes[edge?.source ?? ''];
    }
  }

  for (const node of caseEndNodes) {
    // caseEndNodeは、StartNodeに到達するまでに、必ずCaseStartNodeに到達しないといけない
    let parent = node;
    while (parent) {
      // CaseStartNodeに到達する前に、別のCaseEndNodeに到達したのでおかしい
      if (parent !== node && isCaseEndNode(parent)) {
        return false;
      }
      // CaseStartNodeに到達する前に、StartNodeまで遡れてしまった
      if (isStartNode(parent)) {
        return false;
      }
      if (isCaseStartNode(parent)) break;
      const edge = edgesFromTarget[parent.nodeID];
      parent = nodes[edge?.source ?? ''];
    }
  }

  return true;
}
