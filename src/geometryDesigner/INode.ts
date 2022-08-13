export interface INode {
  readonly className: string;
  readonly absPath: string;
  readonly nodeID: string;
}

export interface IBidirectionalNode extends INode {
  readonly parent: IBidirectionalNode | null;
}

export function getRootNode(
  node: IBidirectionalNode
): IBidirectionalNode | null {
  let {parent} = node;
  if (parent) {
    while (parent.parent) {
      parent = parent.parent;
    }
    return parent;
  }
  return node;
}
