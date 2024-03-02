import {inWorker} from '@utils/helpers';
import {getDgd} from '@store/getDgd';
import {testUpdateNotify} from '@store/reducers/uiTempGeometryDesigner';
import {ISolver} from '@gd/kinematics/ISolver';
import {
  isWorkerMessage,
  FromParent,
  log,
  isCaseResults,
  CaseResults,
  isDoneProgress,
  isWIP,
  wip,
  done,
  isErrorOccurred,
  informError
} from '@worker/solverWorkerMessage';
import store from '@store/store';
import {ISnapshot} from '@gd/analysis/ISnapshot';
import {LocalInstances, getLocalInstances} from '@worker/getLocalInstances';
import {ITest, ITestSolver} from './ITest';
import {isActionNode} from './ActionNode';
import {isCaseStartNode, isCaseEndNode, isAfterEndNode} from './TypeGuards';
import {IFlowNode} from './FlowNode';
import {isEndNode} from './EndNode';

export class TestSolver implements ITestSolver {
  constructor(test: ITest, onTestDone: (solver: TestSolver) => void) {
    this.test = test;
    this.onTestDone = onTestDone;
  }

  private test: ITest;

  private onTestDone: (solver: TestSolver) => void;

  private _done: boolean = false;

  get done() {
    return this._done;
  }

  private set done(value: boolean) {
    this._done = value;
  }

  private _dgdID: string | undefined;

  get dgdID() {
    return this._dgdID;
  }

  private set dgdID(value: string | undefined) {
    this._dgdID = value;
  }

  private _caseResults: CaseResults | null = null;

  get caseResults() {
    return this._caseResults;
  }

  private set caseResults(value: CaseResults | null) {
    this._caseResults = value;
  }

  private _localInstances: LocalInstances | null = null;

  get localInstances() {
    return this._localInstances;
  }

  private set localInstances(value: LocalInstances | null) {
    this._localInstances = value;
  }

  private _running: boolean = false;

  get running() {
    return this._running;
  }

  private set running(value: boolean) {
    this._running = value;
  }

  private wipNodes: number = 0;

  get progress(): {done: number; wip: number} {
    const {wipNodes, doneNodes} = this;
    const nodes =
      Object.values(this.test.nodes).filter((node) => !isAfterEndNode(node))
        .length - 1;
    const progress = {
      done: (doneNodes.length / nodes) * 100,
      wip: (wipNodes / nodes) * 100
    };
    return progress;
  }

  private worker: Worker | undefined = undefined;

  private doneNodes: string[] = [];

  private errorNodes: string[] = [];

  isNodeDone(node: string) {
    return this.doneNodes.includes(node);
  }

  isNodeError(node: string) {
    return this.errorNodes.includes(node);
  }

  private resetTestStatus(onTestEnd = false, onError = false) {
    if (this.worker) this.worker.terminate();
    this.worker = undefined;
    this.running = false;
    this.done = false;
    this.caseResults = null;
    this.localInstances = null;
    this.wipNodes = 0;
    if (!onError) this.errorNodes = [];
    if (!onTestEnd) this.doneNodes = [];
  }

  stop(): void {
    this.resetTestStatus();
    store.dispatch(testUpdateNotify(this.test));
  }

  run(): void {
    if (this.running) throw new Error('Test is already running.');
    if (inWorker()) throw new Error('Task run is called in worker');
    if (this.test.changed) this.test.dispatch();

    this.resetTestStatus();

    const worker = new Worker(
      new URL('../../worker/solverWorker.ts', import.meta.url)
    );

    worker.onmessage = (e) => {
      const {data} = e;
      if (isWorkerMessage(data)) {
        // eslint-disable-next-line no-console
        console.log(`onmessage: ${data.message}`);
      }
      if (isCaseResults(data)) {
        worker.terminate();
        // プログレスバーが最後まで行くのを見たい"
        setTimeout(() => {
          this.resetTestStatus(true);
          this.caseResults = data;
          this.localInstances = getLocalInstances(getDgd(), this.test);
          this.done = true;
          this.dgdID = getDgd().idWoTest;
          this.onTestDone(this);
          store.dispatch(testUpdateNotify(this.test));
        }, 1000);
      }
      if (isDoneProgress(data)) {
        this.doneNodes = [...this.doneNodes, data.nodeID];
        store.dispatch(testUpdateNotify(this.test));
      }
      if (isErrorOccurred(data)) {
        this.errorNodes = [...this.errorNodes, data.nodeID];
        store.dispatch(testUpdateNotify(this.test));
      }
      if (isWIP(data)) {
        ++this.wipNodes;
        store.dispatch(testUpdateNotify(this.test));
      }
    };

    worker.onerror = (e) => {
      // eslint-disable-next-line no-console
      console.log(`${e.message}`);

      this.resetTestStatus(true, true);
      store.dispatch(testUpdateNotify(this.test));
    };

    this.running = true;
    this.done = false;
    store.dispatch(testUpdateNotify(this.test));
    this.worker = worker;
    const fromParent: FromParent = {
      nodeFrom: this.test.startNode.nodeID,
      testID: this.test.nodeID,
      state: getDgd()
    };

    worker.postMessage(fromParent);
  }

  createChildWorker(
    nextNode: IFlowNode,
    state: Required<ISnapshot>
  ): Promise<CaseResults> {
    if (!inWorker())
      throw new Error('createChildWorker is called in main thread.');
    return new Promise<CaseResults>((resolve) => {
      const worker = new Worker(
        new URL('../../worker/solverWorker.ts', import.meta.url)
      );

      worker.onmessage = (e) => {
        const {data} = e;
        if (isWorkerMessage(data)) {
          log(data.message);
        }
        if (isCaseResults(data)) {
          const r = data;
          worker.terminate();
          resolve(r);
        }
        if (isDoneProgress(data)) {
          done(data.nodeID);
        }
        if (isErrorOccurred(data)) {
          informError(data.nodeID);
        }
        if (isWIP(data)) {
          wip();
        }
      };

      worker.onerror = (e) => {
        log(`ERR = ${e}`);
        worker.terminate();
        throw e;
      };

      const fromParent: FromParent = {
        nodeFrom: nextNode.nodeID,
        initialSnapshot: state,
        testID: this.test.nodeID,
        state: getDgd()
      };
      worker.postMessage(fromParent);
    });
  }

  async DFSNodes(
    node: IFlowNode,
    solver: ISolver,
    getSnapshot: (solver: ISolver) => Required<ISnapshot>,
    ret: CaseResults,
    currentCase: string | undefined
  ): Promise<CaseResults> {
    log(`${node.name}`);

    if (isEndNode(node)) {
      return ret;
    }

    wip();
    try {
      if (isActionNode(node)) {
        await node.action(
          solver,
          getSnapshot,
          currentCase ? ret.cases[currentCase].results : undefined
        );
      }
      if (isCaseStartNode(node)) {
        currentCase = node.nodeID;
        ret.cases[node.nodeID] = {name: node.name, results: []};
      }
      if (isCaseEndNode(node)) {
        currentCase = undefined;
      }
    } catch (e) {
      informError(node.nodeID);
      throw e;
    }

    const state = getSnapshot(solver);
    const edges = [...this.test.edgesFromSourceNode[node.nodeID]];

    let children: Promise<CaseResults>[] = [];
    if (edges.length === 1) {
      const edge = edges.pop()!;
      const next = this.test.nodes[edge.target];
      children = [this.DFSNodes(next, solver, getSnapshot, ret, currentCase)];
    } else {
      children = edges.map((edge) => {
        const next = this.test.nodes[edge.target];
        return this.createChildWorker(next, state);
      });
    }
    const results: CaseResults[] = await Promise.all(children);

    ret.cases = results.reduce(
      (prev, current) => {
        prev = {...prev, ...current.cases};
        return prev;
      },
      {} as {
        [index: string]: {
          name: string;
          results: Required<ISnapshot>[];
        };
      }
    );
    done(node.nodeID);

    return ret;
  }
}
