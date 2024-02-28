import {isObject} from '@app/utils/helpers';
import IClipboardItem from '@gd/ClipboardItem';
import {CaseResults} from '@worker/solverWorkerMessage';
import {LocalInstances} from '@worker/getLocalInstances';
import {
  IDataNumber,
  INamedNumber,
  INamedVector3,
  IDataVector3
} from '@gd/INamedValues';
import {IDataFlowNode, IFlowNode, IDataEdge} from './FlowNode';
import {IStartNode} from './StartNode';
import {IEndNode} from './EndNode';
import {IParameterSetter, IDataParameterSetter} from './ParameterSetter';

export type TestResult =
  | 'Completed'
  | 'Solver Error'
  | 'User Canceled'
  | 'Continue';

export interface ISteadySkidpadParams {
  tireData: {[key: string]: string | undefined};
  tireTorqueRatio: {[key: string]: number};
  steering: IParameterSetter;
  steeringMaxStepSize: INamedNumber;
  steeringEps: INamedNumber;
  velocity: INamedNumber;
  velocityEps: INamedNumber;
  radius: INamedNumber;
  radiusEps: INamedNumber;
  lapTimeEps: INamedNumber;
  globalCd: INamedNumber;
  globalCl: INamedNumber;
  searchMode: 'binary' | 'step';
  storeIntermidiateResults: boolean;
  velocityStepSize: INamedNumber;
  radiusStepSize: INamedNumber;
  maxLoopCountR: INamedNumber;
  maxLoopCountV: INamedNumber;
  gravity: INamedVector3;
}

export interface IDataSteadySkidpadParams {
  tireData: {[key: string]: string | undefined};
  tireTorqueRatio: {[key: string]: number};
  steering: IDataParameterSetter;
  steeringMaxStepSize: IDataNumber;
  steeringEps: IDataNumber;
  velocity: IDataNumber;
  velocityEps: IDataNumber;
  radius: IDataNumber;
  radiusEps: IDataNumber;
  lapTimeEps: IDataNumber;
  globalCd: IDataNumber;
  globalCl: IDataNumber;
  searchMode: 'binary' | 'step';
  storeIntermidiateResults: boolean;
  velocityStepSize?: IDataNumber;
  radiusStepSize?: IDataNumber;
  gravity?: IDataVector3;
  maxLoopCountR: IDataNumber;
  maxLoopCountV: IDataNumber;
}

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
  calculateSteadyStateDynamics: boolean;
  steadyStateDynamicsMode: 'SkidpadMaxV' | 'SkidpadMinR';
  steadySkidpadParams?: ISteadySkidpadParams;

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

  addCompletedState(): void;
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
  readonly calculateSteadyStateDynamics?: boolean;
  readonly steadyStateDynamicsMode?: 'SkidpadMaxV' | 'SkidpadMinR';
  readonly steadySkidpadParams?: IDataSteadySkidpadParams;
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
  readonly dgdID: string | undefined;

  run(): void;
  stop(): void;
  isNodeDone(nodeID: string): boolean;
  isNodeError(nodeID: string): boolean;
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
