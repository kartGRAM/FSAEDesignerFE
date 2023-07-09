import {Node as IRFNode, Edge as IRFEdge} from 'reactflow';
import {isObject} from '@app/utils/helpers';
import {IDataFlowNode, IDataEdge, IFlowNode} from './FlowNode';
import {IStartNode} from './StartNode';
import {IEndNode} from './EndNode';
import {IClipboardFlowNodes} from './ClipboardFlowNode';

export type TestResult =
  | 'Completed'
  | 'Solver Error'
  | 'User Canceled'
  | 'Continue';

export interface ITest {
  name: string;
  description: string;
  readonly done: boolean;
  readonly ready: boolean;
  readonly changed: boolean;
  readonly nodeID: string;
  readonly idWoTest: string;
  readonly startNode: IStartNode;
  readonly endNode: IEndNode;
  readonly redoable: boolean;
  readonly undoable: boolean;
  readonly running: boolean;
  readonly paused: boolean;

  undoBlockPoint: string;
  addNode(node: IFlowNode): void;
  removeNode(node: {nodeID: string}): void;
  addEdge(edge: IDataEdge): void;
  removeEdge(edge: {source: string; target: string}): void;
  saveLocalState(): void;
  asLastestState(): void;
  getLocalStateID(): string;
  squashLocalStates(from: string, to: string): void;
  loadLocalState(id: string): void;
  localRedo(): void;
  localUndo(): void;
  copySelectedNodes(): IClipboardFlowNodes;
  validate(): boolean;
  run(onRun: () => void): Promise<TestResult>;
  pause(onPaused: () => void): void;
  stop(onStopped: () => void): void;

  arrange(
    widthSpaceAligningNodes: number,
    heightSpaceAligningNodes: number
  ): void;
  tryConnect(source: string, target: string): boolean;
  getData(): IDataTest;
  getRFNodesAndEdges(canvasUpdate: () => void): {
    nodes: IRFNode[];
    edges: IRFEdge[];
  };
  dispatch(): void;
  readonly nodes: {[index: string]: IFlowNode};
  readonly edges: {[index: string]: IDataEdge};

  readonly edgesFromTarget: {[index: string]: IDataEdge};

  readonly edgesFromSourceNode: {[index: string]: IDataEdge[]};
}

export interface IDataTest {
  readonly isDataTest: true;
  readonly nodeID: string;
  readonly name: string;
  readonly description: string;
  readonly nodes: IDataFlowNode[];
  readonly edges: IDataEdge[];
  readonly localStateID?: string;
  readonly idWoTest: string;
}

export function isDataTest(test: any): test is IDataTest {
  return isObject(test) && test.isDataTest;
}
