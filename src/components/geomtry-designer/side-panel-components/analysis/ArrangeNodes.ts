import {IFlowNode, IDataEdge} from '@gd/analysis/FlowNode';

interface NodeWithEdge extends IFlowNode {
  cost: number;
  done: boolean;
  children: NodeWithEdge[];
  width: number;
  height: number;
  maxHeight: number;
}

export function arrangeNodes(
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
    if (!nodesWithEdge[edge.source]) createNode(nodesWithEdge[edge.source]);
    if (!nodesWithEdge[edge.target]) createNode(nodesWithEdge[edge.target]);
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
      const size = node.getSize();
      node.width = size.width;
      node.height = size.height;
      node.children.forEach((child) => {
        const cost = node.cost + node.width;
        if (child.cost < cost) child.cost = cost;
        queue.push(child);
      });
    }
  }
  // 深さ優先探索にてそろえる
  arrangeImpl(startNodeWithEdge);
}

function arrangeImpl(node: NodeWithEdge): void {
  node.children.sort((lhs, rhs) => rhs.cost - lhs.cost);
  node.maxHeight = node.height;
  node.children.forEach((child) => {
    arrangeImpl(child);
    if (node.maxHeight < child.maxHeight) node.maxHeight = child.maxHeight;
  });
}

function createNode(node: IFlowNode): NodeWithEdge {
  return {
    ...node,
    cost: 0,
    done: false,
    children: [],
    width: -1,
    height: -1,
    maxHeight: -1
  };
}

class PriorityQueue<T extends {cost: number; nodeID: string}> {
  items: {[index: string]: T} = {};

  pop(): T {
    const costs = Object.values(this.items).map((item) => item.cost);
    const maxCost = Math.max(...costs);
    const ret = this.items[maxCost];
    delete this.items[maxCost];
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
