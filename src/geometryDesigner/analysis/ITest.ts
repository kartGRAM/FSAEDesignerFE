import {isObject} from '@app/utils/helpers';
import IClipboardItem from '@gd/ClipboardItem';
import {CaseResults} from '@worker/solverWorkerMessage';
import {LocalInstances} from '@worker/getLocalInstances';
import {IDataFlowNode, IFlowNode, IDataEdge} from './FlowNode';
import {IStartNode} from './StartNode';
import {IEndNode} from './EndNode';

export type TestResult =
  | 'Completed'
  | 'Solver Error'
  | 'User Canceled'
  | 'Continue';

export interface ITest {
  name: string;
  description: string;

  readonly changed: boolean;
  readonly nodeID: string;
  readonly idWoTest: string;
  readonly startNode: IStartNode;
  readonly endNode: IEndNode;
  readonly redoable: boolean;
  readonly undoable: boolean;

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
  isValid: boolean;
  dispatch(): void;

  arrange(
    widthSpaceAligningNodes: number,
    heightSpaceAligningNodes: number
  ): void;
  tryConnect(source: string, target: string): boolean;
  getData(): IDataTest;
  readonly nodes: {[index: string]: IFlowNode};
  readonly edges: {[index: string]: IDataEdge};

  readonly edgesFromTarget: {[index: string]: IDataEdge};

  readonly edgesFromSourceNode: {[index: string]: IDataEdge[]};

  solver: ITestSolver;
}

export interface IDataTest {
  readonly isDataTest: true;
  readonly nodeID: string;
  readonly name: string;
  readonly description: string;
  readonly nodes: IDataFlowNode[];
  readonly edges: IDataEdge[];
  readonly localStateID: string;
  readonly idWoTest: string;
}

export function isDataTest(test: any): test is IDataTest {
  return isObject(test) && test.isDataTest;
}

export interface ITestSolver {
  readonly caseResults: CaseResults | null;
  readonly localInstances: LocalInstances | null;
  readonly done: boolean;
  readonly running: boolean;
  readonly progress: {done: number; wip: number};

  run(): void;
  stop(): void;
}

export function isClipboardFlowNodes(
  item: IClipboardItem
): item is IClipboardFlowNodes {
  return (item as IClipboardFlowNodes).isClipboardFlowNodes;
}

export interface IClipboardFlowNodes extends IClipboardItem {
  isClipboardFlowNodes: true;
  nodes: IDataFlowNode[];
  edges: IDataEdge[];
}
