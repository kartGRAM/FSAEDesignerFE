import {ISnapshot} from '@gd/analysis/ISnapshot';
import {v4 as uuidv4} from 'uuid';
import {ISolver} from '@gd/kinematics/ISolver';
import {getDgd} from '@store/getDgd';
import {isSkidpadSolver} from '@gd/kinematics/SkidpadSolver';
import {
  isStartNode,
  isAssemblyControlNode,
  isCaseControlNode
} from './TypeGuards';
import {IActionNode, IDataActionNode, ActionNode} from './ActionNode';
import {IFlowNode, isDataFlowNode, IDataFlowNode, IDataEdge} from './FlowNode';
import {
  IParameterSetter,
  IDataParameterSetter,
  ParameterSetter
} from './ParameterSetter';

export const className = 'Setter' as const;
type ClassName = typeof className;

export interface ISetterNode extends IActionNode {
  className: ClassName;
  readonly copyFrom: string | undefined;
  setCopyFrom(org: IFlowNode | null): void;
  listSetters: IParameterSetter[];
  isModRow: {[index: string]: boolean | undefined};
}

export interface IDataSetterNode extends IDataActionNode {
  className: ClassName;
  copyFrom: string | undefined;
  listSetters: IDataParameterSetter[];
  isModRow: {[index: string]: boolean | undefined};
}

export class SetterNode extends ActionNode implements ISetterNode {
  async action(
    solver: ISolver,
    getSnapshot: (solver: ISolver) => Required<ISnapshot>,
    ss?: Required<ISnapshot>[]
  ): Promise<void> {
    const state = getDgd();
    const fsddc = state.options.fixSpringDumperDuaringControl;
    this.listSetters.forEach((setter) => setter.set(solver));

    if (isSkidpadSolver(solver)) {
      let s: Required<ISnapshot>[] = [];
      if (solver.config.solverMode === 'SkidpadMaxV') {
        s = solver.solveMaxV({getSnapshot});
      } else {
        solver.solveTargetRadius({getSnapshot, ss: s});
      }
      // solver.solve();
      // const s = [getSnapshot(solver)];

      if (ss) {
        ss.push(...s);
      }
    } else {
      solver.solve({
        postProcess: false,
        constraintsOptions: {
          fixSpringDumpersAtCurrentPositions: fsddc
        }
      });
      if (ss) {
        ss.push(getSnapshot(solver));
      }
    }
  }

  readonly className = className;

  listSetters: IParameterSetter[];

  isModRow: {[index: string]: boolean | undefined};

  private _copyFrom: string | undefined;

  get copyFrom(): string | undefined {
    return this._copyFrom;
  }

  setCopyFrom(org: IFlowNode | null) {
    if (org && isSetterNode(org)) {
      if (org.nodeID === this._copyFrom) {
        this.isModRow = org.listSetters.reduce((prev, current) => {
          prev[current.target] = false;
          if (this.isModRow[current.target]) {
            prev[current.target] = true;
          }
          return prev;
        }, {} as {[index: string]: boolean | undefined});
        this.listSetters = org.listSetters.map((s) => {
          if (this.isModRow[s.target]) {
            const mod = this.listSetters.find((d) => d.target === s.target);
            if (mod) return mod;
          }
          return new ParameterSetter(s.getData());
        });
      } else {
        this._copyFrom = org.nodeID;
        this.isModRow = org.listSetters.reduce((prev, current) => {
          prev[current.target] = false;
          return prev;
        }, {} as {[index: string]: boolean | undefined});
        this.listSetters = org.listSetters.map(
          (s) => new ParameterSetter(s.getData())
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

  getData(nodes: {[index: string]: IFlowNode | undefined}): IDataSetterNode {
    const data = super.getData(nodes);
    const nodeCopyFrom = nodes[this.copyFrom ?? ''];
    const copyFrom =
      nodeCopyFrom && isSetterNode(nodeCopyFrom) ? nodeCopyFrom : undefined;

    const listSetters = copyFrom
      ? copyFrom.listSetters.map((setter) => {
          const mod = this.listSetters.find((d) => d.target === setter.target);
          if (this.isModRow[setter.target] && mod) {
            return mod.getData();
          }
          return setter.getData();
        })
      : this.listSetters.map((s) => s.getData());
    return {
      ...data,
      className: this.className,
      listSetters,
      copyFrom: this.copyFrom,
      isModRow: copyFrom
        ? copyFrom.listSetters.reduce((prev, current) => {
            prev[current.target] = this.isModRow[current.target];
            return prev;
          }, {} as {[index: string]: boolean | undefined})
        : {}
    };
  }

  constructor(
    params:
      | {
          name: string;
          position: {x: number; y: number};
          nodeID?: string;
        }
      | IDataSetterNode,
    parentTestID: string
  ) {
    super(params, parentTestID);
    this.listSetters = [];
    this.isModRow = {};
    this._copyFrom = undefined;
    if (isDataFlowNode(params) && isDataSetterNode(params)) {
      const data = params;
      this._copyFrom = data.copyFrom;
      this.listSetters = data.listSetters.map(
        (setterData) => new ParameterSetter(setterData)
      );
      this.isModRow = {...data.isModRow};
    }
  }

  clone(nodes: {[index: string]: IFlowNode | undefined}): ISetterNode {
    const ret = new SetterNode(
      {...this.getData(nodes), nodeID: uuidv4()},
      this.parentTestID
    );
    const org = nodes[ret.copyFrom ?? ''] ?? null;
    ret.setCopyFrom(org);
    return ret;
  }
}

export function isSetterNode(node: IFlowNode): node is ISetterNode {
  return node.className === className;
}

export function isDataSetterNode(node: IDataFlowNode): node is IDataSetterNode {
  return node.className === className;
}
