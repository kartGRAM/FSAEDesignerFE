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
/*
export function getNode(
  anywhereNode: IBidirectionalNode,
  absPath: string
): IBidirectionalNode | null {
  const root = getRootNode(anywhereNode);
  return getNodeCore(root, absPath);
}

function getNodeCore(
  root: IBidirectionalNode,
  path: string
): IBidirectionalNode | null {
  const splitedPath = path.split('@');
  const count = splitedPath.length;
  const lastPath = splitedPath.pop();
  if (lastPath !== root.nodeID) return null;
  if (count === 1) return root;
  const children = root.getChildNodes();
  const childPath = splitedPath.join('@');
  // eslint-disable-next-line no-restricted-syntax
  for (const child of children) {
    const ret = getNodeCore(child, childPath);
    if (ret) return ret;
  }
  return null;
}

*/
