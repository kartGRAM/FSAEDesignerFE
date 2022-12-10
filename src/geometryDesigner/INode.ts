export interface INode {
  readonly className: string;
  readonly absPath: string;
  readonly nodeID: string;
}

export interface IBidirectionalNode extends INode {
  getNamedAbsPath(): string;
  getName(): string;
  readonly parent: IBidirectionalNode | null;
  // getChildNodes(): IBidirectionalNode[];
}

export function getRootNode(node: IBidirectionalNode): IBidirectionalNode {
  let {parent} = node;
  if (parent) {
    while (parent.parent) {
      parent = parent.parent;
    }
    return parent;
  }
  return node;
}
