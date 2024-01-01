import {Vector3} from 'three';
// import * as THREE from 'three';
import {
  NamedVector3,
  NamedVector3LW,
  NamedMatrix3,
  NamedQuaternion,
  NamedNumber,
  NamedBooleanOrUndefined
} from '@gd/NamedValues';
import {
  INamedNumberRO,
  IDataVector3,
  INamedVector3,
  INamedVector3RO,
  FunctionVector3
} from '@gd/INamedValues';

import {GDState} from '@store/reducers/dataGeometryDesigner';
import {
  isDataElement,
  MirrorError,
  Elements,
  Joint,
  JointAsVector3,
  NodeID,
  IElement,
  isElement,
  IDataElement,
  IAssembly,
  IDataAssembly,
  isAssembly,
  assignMeta,
  isMirror
} from '../IElements';
import {Element, mirrorVec} from './ElementBase';
import {getElement} from '../Elements';

export class Assembly extends Element implements IAssembly {
  isAssembly = true as const;

  // eslint-disable-next-line class-methods-use-this
  get className(): Elements {
    return 'Assembly';
  }

  _children: IElement[];

  get children(): IElement[] {
    return this._children;
  }

  set children(elements: IElement[]) {
    this._children = elements;
    this._children.forEach((child) => {
      child.parent = this;
    });
  }

  appendChild(children: IElement | IElement[]): void {
    if (isElement(children)) children = [children];
    children.forEach((child) => {
      child.parent = this;
    });

    this._children = [...this._children, ...children];
  }

  get visible(): NamedBooleanOrUndefined {
    let allTrue = true;
    let allFalse = false;
    let undef = false;
    this.children.forEach((child) => {
      if (child.visible.value === undefined) {
        undef = true;
        return;
      }
      allTrue = allTrue && child.visible.value;
      allFalse = allFalse || child.visible.value;
    });
    const update = (newValue: boolean | undefined) => {
      this.visible = new NamedBooleanOrUndefined({
        name: 'visible',
        parent: this,
        value: newValue
      });
    };
    if (undef)
      return new NamedBooleanOrUndefined({
        name: 'visible',
        parent: this,
        value: undefined,
        update
      });
    if (allTrue)
      return new NamedBooleanOrUndefined({
        name: 'visible',
        parent: this,
        value: true,
        update
      });
    if (!allFalse)
      return new NamedBooleanOrUndefined({
        name: 'visible',
        parent: this,
        value: false,
        update
      });
    return new NamedBooleanOrUndefined({
      name: 'visible',
      parent: this,
      value: undefined,
      update
    });
  }

  set visible(visibility: NamedBooleanOrUndefined) {
    this.children.forEach((child) => {
      child.visible.value = visibility.value;
    });
  }

  joints: Joint[];

  initialPosition: NamedVector3;

  get position(): NamedVector3LW {
    return new NamedVector3LW({name: 'position', parent: this});
  }

  // eslint-disable-next-line class-methods-use-this
  set position(p: NamedVector3LW) {
    // throw Error('Not Supported Exception');
  }

  collectElements(): IAssembly {
    const joints = [...this.joints];
    const children: IElement[] = [];
    this.children.forEach((child) => {
      if (isAssembly(child)) {
        const asm = child.collectElements();
        joints.push(...asm.joints);
        children.push(...asm.children);
      } else {
        children.push(child);
      }
    });
    return new Assembly({
      name: 'collectedAssembly',
      joints,
      children,
      ignoreArrange: true
    });
  }

  getJointsAsVector3(): JointAsVector3[] {
    const points = this.getAllPointsOfChildren();
    const joints = this.joints.reduce(
      (prev: JointAsVector3[], joint): JointAsVector3[] => {
        const lhs = points.find((p) => p.nodeID === joint.lhs);
        const rhs = points.find((p) => p.nodeID === joint.rhs);
        if (lhs && rhs) {
          return [...prev, {lhs, rhs}];
        }
        return prev;
      },
      [] as JointAsVector3[]
    );
    return joints;
  }

  getJointsRecursive(): Joint[] {
    let joints: Joint[] = [...this.joints];
    this.children.forEach((child) => {
      if (isAssembly(child)) {
        joints = [...joints, ...child.getJointsRecursive()];
      }
    });
    return joints;
  }

  flatten(noAssembly: boolean = false): IElement[] {
    const ret: IElement[] = noAssembly ? [] : [this];
    this.children.forEach((child) => {
      if (isAssembly(child)) {
        ret.push(...child.flatten(noAssembly));
      } else {
        ret.push(child);
      }
    });
    return ret;
  }

  findElement(nodeID: string): IElement | undefined {
    if (nodeID === this.nodeID) return this;
    for (const child of this.children) {
      if (isAssembly(child)) {
        const element = child.findElement(nodeID);
        if (element) return element;
      } else if (child.nodeID === nodeID) return child;
    }
    return undefined;
  }

  getElementByName(name: string): IElement | undefined {
    const elements = this.flatten();
    return elements.find((element) => element.name.value === name);
  }

  private getJointedNodeIDs(): NodeID[] {
    return this.joints.reduce((prev, current): NodeID[] => {
      prev.push(current.lhs, current.rhs);
      return prev;
    }, [] as NodeID[]);
  }

  getAllPointsOfChildren(): INamedVector3RO[] {
    let points: INamedVector3RO[] = [];
    this._children.forEach((child) => {
      points = [...points, ...child.getPoints()];
    });
    return points;
  }

  getAllPointsNodeIDsOfChildren(): string[] {
    let points: string[] = [];
    this._children.forEach((child) => {
      points = [...points, ...child.getPointsNodeIDs()];
    });
    return points;
  }

  getVariablesAll(): INamedNumberRO[] {
    return [
      ...this.getVariables(),
      ...this.children
        .map((child) => {
          if (isAssembly(child)) return child.getVariablesAll();
          return child.getVariables();
        })
        .flat()
    ];
  }

  getVariablesAllWithParent(): {parent: IElement; values: INamedNumberRO[]}[] {
    const children = this.children
      .map((child) => {
        if (isAssembly(child)) return child.getVariablesAllWithParent();
        return [{parent: child, values: child.getVariables()}];
      })
      .flat();
    return [{parent: this, values: this.getVariables()}, ...children];
  }

  getVariablesAllWithParentFlat(): {parent: IElement; value: INamedNumberRO}[] {
    const children = this.children
      .map((child) => {
        if (isAssembly(child)) return child.getVariablesAllWithParentFlat();
        return child.getVariables().map((v) => ({parent: child, value: v}));
      })
      .flat();

    return [
      ...this.getVariables().map((v) => ({parent: this, value: v})),
      ...children
    ];
  }

  getMeasurablePointsAll(): INamedVector3RO[] {
    return [
      ...this.getMeasurablePoints(),
      ...this.children.map((child) => child.getMeasurablePoints()).flat()
    ];
  }

  getMeasurablePoints(): INamedVector3RO[] {
    return [this.centerOfGravity];
  }

  getPoints(): INamedVector3RO[] {
    let points: INamedVector3RO[] = [];
    const jointedNodeIDs = this.getJointedNodeIDs();
    this._children.forEach((child) => {
      const notJointed = child
        .getPoints()
        .filter((p) => !jointedNodeIDs.includes(p.nodeID));
      points = [...points, ...notJointed];
    });
    return points;
  }

  getPointsNodeIDs(): string[] {
    let points: string[] = [];
    const jointedNodeIDs = this.getJointedNodeIDs();
    this._children.forEach((child) => {
      const notJointed = child
        .getPointsNodeIDs()
        .filter((p) => !jointedNodeIDs.includes(p));
      points = [...points, ...notJointed];
    });
    return points;
  }

  getJointedPoints(): INamedVector3RO[] {
    let points: INamedVector3RO[] = [];
    const jointedNodeIDs = this.getJointedNodeIDs();
    this._children.forEach((child) => {
      const notJointed = child
        .getPoints()
        .filter((p) => jointedNodeIDs.includes(p.nodeID));
      points = [...points, ...notJointed];
    });
    return points;
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.children.forEach((child) => {
      child.arrange(this.initialPosition.value.clone().add(pp));
    });
  }

  getMirror(): Assembly {
    if (isMirror(this)) throw new MirrorError('ミラーはミラーできない');
    const children = this.children.map((child) => child.getMirror());
    let mirPoints: string[] = [];
    children.forEach((child) => {
      mirPoints = [...mirPoints, ...child.getPointsNodeIDs()];
    });
    const points = this.getAllPointsNodeIDsOfChildren();

    const joints: Joint[] = this.joints.map((joint) => {
      return {
        lhs: mirPoints[points.findIndex((p) => p === joint.lhs)],
        rhs: mirPoints[points.findIndex((p) => p === joint.rhs)]
      };
    });

    const initialPosition = mirrorVec(this.initialPosition);

    const ret = new Assembly({
      name: `mirror_${this.name.value}`,
      children,
      joints,
      initialPosition
    });
    assignMeta(ret, {mirror: {to: this.nodeID}});
    return ret;
  }

  get mass(): NamedNumber {
    let mass = 0;
    this.children.forEach((child) => {
      mass += child.mass.value;
    });
    return new NamedNumber({
      name: 'mass',
      parent: this,
      value: mass
    });
  }

  // eslint-disable-next-line no-empty-function, class-methods-use-this
  set mass(m: NamedNumber) {}

  get centerOfGravity(): NamedVector3 {
    const center = new Vector3();
    this.children.forEach((child) => {
      center.add(child.position.value.clone().multiplyScalar(child.mass.value));
    });
    return new NamedVector3({
      name: 'centerOfGravity',
      parent: this,
      value: center,
      nodeID: `${this.nodeID}cog`
    });
  }

  // eslint-disable-next-line no-empty-function, class-methods-use-this
  set centerOfGravity(v: NamedVector3) {}

  get inertialTensor(): NamedMatrix3 {
    return new NamedMatrix3({
      parent: this,
      name: 'inertialTensor'
    });
  }

  // eslint-disable-next-line no-empty-function, class-methods-use-this
  set inertialTensor(mat: NamedMatrix3) {}

  // eslint-disable-next-line no-empty-function
  get rotation(): NamedQuaternion {
    return new NamedQuaternion({
      parent: this,
      name: 'rotation'
    });
  }

  // eslint-disable-next-line no-empty-function, class-methods-use-this
  set rotation(mat: NamedQuaternion) {}

  constructor(
    params:
      | {
          name: string;
          children: IElement[];
          joints: Joint[];
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          ignoreArrange?: boolean;
        }
      | IDataAssembly
  ) {
    super(params);

    const {initialPosition} = params;
    this.initialPosition = new NamedVector3({
      name: 'initialPosition',
      parent: this,
      value: initialPosition
    });
    if (isDataElement(params)) {
      this._children = params.children.map((child) => getElement(child));
      this._children.forEach((child) => {
        child.parent = this;
      });
      const allPoints = this.getAllPointsNodeIDsOfChildren();
      const joints = params.joints.filter((joint) => {
        const lhs = allPoints.find((p) => p === joint.lhs);
        const rhs = allPoints.find((p) => p === joint.rhs);
        return lhs && rhs;
      });
      const joints2 = joints.map((joint) => {
        return {
          lhs: allPoints.find((p) => p === joint.lhs)!,
          rhs: allPoints.find((p) => p === joint.rhs)!
        };
      });
      this.joints = joints2;
      this.arrange();
    } else {
      this._children = params.children;
      this.joints = params.joints;
      if (!params.ignoreArrange) {
        this._children.forEach((child) => {
          child.parent = this;
        });
        this.arrange();
      }
    }
  }

  getDataElement(state: GDState): IDataAssembly | undefined {
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const mir = this.getAnotherElement(mirror);
    const baseData = super.getDataElementBase(state, mir);

    if (mir && isAssembly(mir)) {
      if (!isMirror(this.parent) && mir.parent !== this.parent)
        return undefined;
      const myChildren = this.children.reduce(
        (obj, x) =>
          Object.assign(obj, {
            [x.meta?.mirror?.to ?? 'なぜかミラー設定されていない']: x
          }),
        {} as {[name: string]: IElement}
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let pointsNodeIDs: string[] = [];
      const children = mir.children
        .map((child) => {
          if (Object.keys(myChildren).includes(child.nodeID)) {
            const myChild = myChildren[child.nodeID];
            pointsNodeIDs = [...pointsNodeIDs, ...myChild.getPointsNodeIDs()];
            return myChild.getDataElement(state);
          }
          const myChild = child.getMirror();
          myChild.parent = this;
          pointsNodeIDs = [...pointsNodeIDs, ...myChild.getPointsNodeIDs()];
          return myChild.getDataElement(state);
        })
        .filter((child) => child !== undefined) as IDataElement[];

      const mirPoints = mir.getAllPointsNodeIDsOfChildren();

      const joints = mir.joints.map((joint) => {
        return {
          lhs: pointsNodeIDs[mirPoints.findIndex((p) => p === joint.lhs)],
          rhs: pointsNodeIDs[mirPoints.findIndex((p) => p === joint.rhs)]
        };
      });
      return {
        ...baseData,
        visible: this.visible.getData(),
        isDataAssembly: true,
        children,
        joints
        // joints: []
      };
    }
    return {
      ...baseData,
      isDataAssembly: true,
      children: this.children
        .map((child) => child.getDataElement(state))
        .filter((child) => child !== undefined) as IDataElement[],
      joints: this.joints.map((joint) => {
        return {lhs: joint.lhs, rhs: joint.rhs};
      })
    };
  }
}
