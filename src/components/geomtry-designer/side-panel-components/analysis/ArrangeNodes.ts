import {IFlowNode, IDataEdge} from '@gd/analysis/FlowNode';

interface NodeWithEdge extends IFlowNode {
  cost: number;
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
  // ダイクストラ法にてパスツリーを作る。
  {
    const queue = new PriorityQueue<NodeWithEdge>();
    const startNode = startNodeWithEdge;
    queue.push(startNode);
    while (queue.length !== 0) {
      const node = queue.pop();
      node.done = true;
      const size = nodes[node.nodeID].getSize();
      node.width = size.width;
      node.height = size.height;
      node.children.forEach((child) => {
        if (child.done) return;
        const cost = node.cost + node.width + wSpace;
        if (child.cost < cost) {
          child.cost = cost;
          child.parent = node.nodeID;
        }
        queue.push(child);
      });
    }
  }
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
  node.children.sort((lhs, rhs) => rhs.cost - lhs.cost);
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
    const y = node.height / 2 - child.height / 2 + offset;
    if (i === 0) {
      offset += child.stackedHeightBottomHarf + hSpace;
    } else {
      offset +=
        child.stackedHeightBottomHarf + child.stackedHeightUpperHarf + hSpace;
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
    done: false,
    children: [],
    parent: undefined,
    width: -1,
    height: -1,
    stackedHeightBottomHarf: -1,
    stackedHeightUpperHarf: -1
  };
}

class PriorityQueue<T extends {cost: number; nodeID: string}> {
  items: {[index: string]: T} = {};

  pop(): T {
    let id = '';
    let maxCost = -1;
    Object.values(this.items).forEach((item) => {
      if (item.cost > maxCost) {
        id = item.nodeID;
        maxCost = item.cost;
      }
    });
    const ret = this.items[id];
    delete this.items[id];
    return ret;
  }

  push(item: T): void {
    if (this.constains(item)) return;
    this.items[item.nodeID] = item;
  }

  constains(item: T): boolean {
    return !!this.items[item.nodeID];
  }

  get length(): number {
    return Object.keys(this.items).length;
  }
}
