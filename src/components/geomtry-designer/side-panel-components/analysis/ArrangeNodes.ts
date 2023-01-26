import {IFlowNode, IDataEdge} from '@gd/analysis/FlowNode';

interface NodeWithEdge extends IFlowNode {
  cost: number;
  endCost: number;
  isEndNode: boolean;
  done: boolean;
  children: NodeWithEdge[];
  width: number;
  height: number;
  parent: string | undefined;
  stackedHeightBottomHarf: number;
  stackedHeightUpperHarf: number;
}

export default function arrangeNodes(
  startNode: IFlowNode,
  nodes: {[indes: string]: IFlowNode},
  edges: IDataEdge[],
  hSpace: number,
  wSpace: number
): void {
  const nodesWithEdge: {[index: string]: NodeWithEdge} = {};

  const nodeIDs = Object.keys(nodes);
  const cleanedEdges = Object.values(edges).filter(
    (edge) => nodeIDs.includes(edge.source) && nodeIDs.includes(edge.target)
  );
  cleanedEdges.forEach((edge) => {
    if (!nodesWithEdge[edge.source])
      nodesWithEdge[edge.source] = createNode(nodes[edge.source]);
    if (!nodesWithEdge[edge.target])
      nodesWithEdge[edge.target] = createNode(nodes[edge.target]);
    nodesWithEdge[edge.source].children.push(nodesWithEdge[edge.target]);
  });
  const startNodeWithEdge = nodesWithEdge[startNode.nodeID];
  if (!startNodeWithEdge) return;
  // ヘルマンフォード法にて最長パスツリーを作る。閉路は認めない
  startNodeWithEdge.cost = 0;
  const vNodesWithEdge = Object.values(nodesWithEdge);
  vNodesWithEdge.forEach((_, i) => {
    cleanedEdges.forEach((edge) => {
      const from = nodesWithEdge[edge.source];
      const to = nodesWithEdge[edge.target];
      if (from.width === -1) {
        const size = nodes[from.nodeID].getSize();
        from.width = size.width;
        from.height = size.height;
      }
      const cost = from.cost + from.width + wSpace;
      if (to.cost < cost) {
        to.cost = cost;
        to.parent = from.nodeID;
        if (i === Object.keys(nodesWithEdge).length - 1) {
          throw new Error('テストに閉経路がある');
        }
      }
    });
  });
  // 不要なnodeのChilderenを消す
  vNodesWithEdge.forEach((node) => {
    node.children = node.children.filter(
      (child) => child.parent === node.nodeID
    );
    if (node.children.length === 0) node.isEndNode = true;
  });
  const endNodes = vNodesWithEdge.filter((node) => node.isEndNode);
  endNodes.forEach((node) => {
    node.endCost = node.cost;

    const size = nodes[node.nodeID].getSize();
    node.width = size.width;
    node.height = size.height;
    let {parent} = node;
    while (parent) {
      if (nodesWithEdge[parent].endCost < node.cost)
        nodesWithEdge[parent].endCost = node.cost;
      parent = nodesWithEdge[parent].parent;
    }
  });
  // 深さ優先探索にてそろえる
  startNodeWithEdge.position = {x: 0, y: 0};
  nodes[startNodeWithEdge.nodeID].position = startNodeWithEdge.position;
  arrangeImpl({node: startNodeWithEdge, wSpace, hSpace, original: nodes});
}

function arrangeImpl(params: {
  node: NodeWithEdge;
  wSpace: number;
  hSpace: number;
  original: {[indes: string]: IFlowNode};
}): void {
  const {node, hSpace, wSpace, original} = params;
  node.children.sort((lhs, rhs) => {
    return rhs.endCost - lhs.endCost;
    /* const cost = rhs.endCost - lhs.endCost;
    // どちらかが長い場合はそちらを上側に描写
    if (cost !== 0) return cost;
    // 同じ場合は。親が自分の場合を優先
    if (lhs.parent === node.nodeID && rhs.parent === node.nodeID) return 0;
    if (lhs.parent === node.nodeID) return -Number.EPSILON;
    return Number.EPSILON; */
  });
  node.stackedHeightUpperHarf = node.height / 2;
  node.stackedHeightBottomHarf = node.height / 2;
  let childrenHeightBottomHarf = 0;

  let offset = 0;

  node.children.forEach((child, i) => {
    if (child.parent !== node.nodeID) return;
    // まずはnodeの子までを含めたサイズを求める
    child.position = {x: 0, y: 0};
    original[child.nodeID].position = child.position;
    // 再帰的に子を整列
    arrangeImpl({node: child, wSpace, hSpace, original});
    if (i === 0) {
      if (node.stackedHeightUpperHarf < child.stackedHeightUpperHarf) {
        node.stackedHeightUpperHarf = child.stackedHeightUpperHarf;
      }
      childrenHeightBottomHarf += child.stackedHeightBottomHarf;
    } else {
      childrenHeightBottomHarf +=
        child.stackedHeightBottomHarf + child.stackedHeightUpperHarf + hSpace;
    }
    if (node.stackedHeightBottomHarf < childrenHeightBottomHarf)
      node.stackedHeightBottomHarf = childrenHeightBottomHarf;

    // 子を整列する。
    const x = node.width + wSpace;
    const y =
      node.height / 2 -
      child.height / 2 +
      offset +
      (i > 0 ? child.stackedHeightUpperHarf : 0);
    if (i === 0) {
      offset += child.stackedHeightBottomHarf + hSpace;
    } else {
      offset +=
        child.stackedHeightUpperHarf + child.stackedHeightBottomHarf + hSpace;
    }

    setPositionRecursive({node: child, delta: {x, y}, original});
  });
}

function setPositionRecursive(params: {
  node: NodeWithEdge;
  delta: {x: number; y: number};
  original: {[indes: string]: IFlowNode};
}) {
  const {node, delta, original} = params;
  // if (node.done) return;
  const {x, y} = node.position;
  node.position = {x: x + delta.x, y: y + delta.y};
  original[node.nodeID].position = node.position;
  node.children.forEach((child) => {
    if (child.parent !== node.nodeID) return;
    setPositionRecursive({node: child, delta, original});
  });
}

function createNode(node: IFlowNode): NodeWithEdge {
  return {
    ...node,
    cost: 0,
    endCost: 0,
    isEndNode: false,
    done: false,
    children: [],
    parent: undefined,
    width: -1,
    height: -1,
    stackedHeightBottomHarf: -1,
    stackedHeightUpperHarf: -1
  };
}
