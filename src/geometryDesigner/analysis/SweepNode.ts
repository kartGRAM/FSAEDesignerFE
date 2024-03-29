// eslint-env es6
import {v4 as uuidv4} from 'uuid';
import {ISolver} from '@gd/kinematics/ISolver';
import {getDgd} from '@store/getDgd';
import {ISnapshot} from '@gd/analysis/ISnapshot';
import {isSkidpadSolver} from '@gd/kinematics/SkidpadSolver';
import {
  SweepResults,
  isSweepResults,
  FromParentSweepWorker
} from '@worker/solverWorkerMessage';
import {inWorker} from '@utils/helpers';
import {
  IParameterSweeper,
  IDataParameterSweeper,
  ParameterSweeper
} from './ParameterSweeper';
import {IDataParameterSetter} from './ParameterSetter';
import {
  isStartNode,
  isAssemblyControlNode,
  isCaseControlNode
} from './TypeGuards';
import {IActionNode, IDataActionNode, ActionNode} from './ActionNode';
import {IFlowNode, isDataFlowNode, IDataFlowNode, IDataEdge} from './FlowNode';

export const className = 'Sweep' as const;
type ClassName = typeof className;

export interface ISweepNode extends IActionNode {
  className: ClassName;
  readonly copyFrom: string | undefined;
  setCopyFrom(org: IFlowNode | null): void;
  listSweepers: IParameterSweeper[];
  isModRow: {[index: string]: boolean | undefined};
}

export interface IDataSweepNode extends IDataActionNode {
  className: ClassName;
  listSweepers: IDataParameterSweeper[];
  copyFrom: string | undefined;
  isModRow: {[index: string]: boolean | undefined};
}

export class SweepNode extends ActionNode implements ISweepNode {
  async action(
    solver: ISolver,
    getSnapshot: (solver: ISolver) => Required<ISnapshot>,
    ss?: Required<ISnapshot>[]
  ): Promise<void> {
    const state = getDgd();
    const fsddc = state.options.fixSpringDumperDuaringControl;

    if (
      isSkidpadSolver(solver) &&
      solver.config.solverMode !== 'SkidpadSimple'
    ) {
      const workers: Promise<SweepResults>[] = [];
      for (let step = 0; ; ++step) {
        let done = true;
        const setters: IDataParameterSetter[] = [];
        this.listSweepers.forEach((s) => {
          const [setter, doneTemp] = s.setParallel(step);
          setters.push(setter);
          done = done && doneTemp;
        });
        workers.push(
          this.createChildWorker(setters, getSnapshot(solver), step)
        );
        if (done) break;
      }
      const results: SweepResults[] = await Promise.all([...workers]);
      results.sort((lhs, rhs) => (lhs.step < rhs.step ? -1 : 1));
      results.forEach((result) => {
        if (ss) ss.push(...result.results);
      });
    } else {
      for (let step = 0; ; ++step) {
        let done = true;
        this.listSweepers.forEach((s) => {
          done = done && s.set(solver, step);
        });

        solver.solve({
          postProcess: false,
          constraintsOptions: {
            fixSpringDumpersAtCurrentPositions: fsddc
          }
        });
        if (ss) {
          ss.push(getSnapshot(solver));
        }
        if (done) break;
      }
    }
  }

  createChildWorker(
    setters: IDataParameterSetter[],
    state: Required<ISnapshot>,
    step: number
  ): Promise<SweepResults> {
    if (!inWorker())
      throw new Error('createChildWorker is called in main thread.');
    return new Promise<SweepResults>((resolve) => {
      const worker = new Worker(
        new URL('../../worker/skidpadSweepWorker.ts', import.meta.url)
      );

      worker.onmessage = (e) => {
        const {data} = e;
        if (isSweepResults(data)) {
          const r = data;
          worker.terminate();
          resolve(r);
        }
      };

      worker.onerror = (e) => {
        // eslint-disable-next-line no-console
        console.log(`ERR = ${e}`);
        worker.terminate();
        throw e;
      };

      const fromParent: FromParentSweepWorker = {
        initialSnapshot: state,
        state: getDgd(),
        step,
        setters,
        testID: this.parentTestID
      };
      worker.postMessage(fromParent);
    });
  }

  readonly className = className;

  listSweepers: IParameterSweeper[];

  isModRow: {[index: string]: boolean | undefined};

  private _copyFrom: string | undefined;

  get copyFrom(): string | undefined {
    return this._copyFrom;
  }

  setCopyFrom(org: IFlowNode | null) {
    if (org && isSweepNode(org)) {
      if (org.nodeID === this._copyFrom) {
        this.isModRow = org.listSweepers.reduce((prev, current) => {
          prev[current.target] = false;
          if (this.isModRow[current.target]) {
            prev[current.target] = true;
          }
          return prev;
        }, {} as {[index: string]: boolean | undefined});
        this.listSweepers = org.listSweepers.map((s) => {
          if (this.isModRow[s.target]) {
            const mod = this.listSweepers.find((d) => d.target === s.target);
            if (mod) return mod;
          }
          return new ParameterSweeper(s.getData());
        });
      } else {
        this._copyFrom = org.nodeID;
        this.isModRow = org.listSweepers.reduce((prev, current) => {
          prev[current.target] = false;
          return prev;
        }, {} as {[index: string]: boolean | undefined});
        this.listSweepers = org.listSweepers.map(
          (s) => new ParameterSweeper(s.getData())
        );
      }
      return;
    }
    this._copyFrom = undefined;
    this.isModRow = {};
  }

  acceptable(
    node: IFlowNode,
    nodes: {[index: string]: IFlowNode | undefined},
    edges: {[index: string]: IDataEdge | undefined},
    edgesFromSource: {[index: string]: IDataEdge[]}
  ): boolean {
    if (!super.acceptable(node, nodes, edges, edgesFromSource)) return false;
    if (
      isStartNode(node) ||
      isAssemblyControlNode(node) ||
      isCaseControlNode(node)
    )
      return true;
    return false;
  }

  validate(
    edgesFromTarget: {[index: string]: IDataEdge | undefined},
    edgesFromSource: {[index: string]: IDataEdge[]}
  ): boolean {
    if (
      edgesFromSource[this.nodeID]?.length > 0 &&
      edgesFromTarget[this.nodeID]
    )
      return true;
    return false;
  }

  getData(nodes: {[index: string]: IFlowNode | undefined}): IDataSweepNode {
    const data = super.getData(nodes);
    const nodeCopyFrom = nodes[this.copyFrom ?? ''];
    const copyFrom =
      nodeCopyFrom && isSweepNode(nodeCopyFrom) ? nodeCopyFrom : undefined;

    const listSweepers = copyFrom
      ? copyFrom.listSweepers.map((setter) => {
          const mod = this.listSweepers.find((d) => d.target === setter.target);
          if (this.isModRow[setter.target] && mod) {
            return mod.getData();
          }
          return setter.getData();
        })
      : this.listSweepers.map((s) => s.getData());
    return {
      ...data,
      className: this.className,
      listSweepers,
      copyFrom: this.copyFrom,
      isModRow: copyFrom
        ? copyFrom.listSweepers.reduce((prev, current) => {
            prev[current.target] = this.isModRow[current.target];
            return prev;
          }, {} as {[index: string]: boolean | undefined})
        : {}
    };
  }

  constructor(
    params:
      | {name: string; position: {x: number; y: number}; nodeID?: string}
      | IDataSweepNode,
    parentTestID: string
  ) {
    super(params, parentTestID);
    this.listSweepers = [];
    this.isModRow = {};
    this._copyFrom = undefined;
    if (isDataFlowNode(params) && isDataSweepNode(params)) {
      const data = params;
      this._copyFrom = data.copyFrom;
      this.listSweepers = data.listSweepers.map(
        (setterData) => new ParameterSweeper(setterData)
      );
      this.isModRow = {...data.isModRow};
    }
  }

  clone(nodes: {[index: string]: IFlowNode | undefined}): ISweepNode {
    const ret = new SweepNode(
      {...this.getData(nodes), nodeID: uuidv4()},
      this.parentTestID
    );
    const org = nodes[ret.copyFrom ?? ''] ?? null;
    ret.setCopyFrom(org);
    return ret;
  }
}

export function isSweepNode(node: IFlowNode): node is ISweepNode {
  return node.className === className;
}

export function isDataSweepNode(node: IDataFlowNode): node is IDataSweepNode {
  return node.className === className;
}
