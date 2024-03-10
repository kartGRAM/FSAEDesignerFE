import {Vector3} from 'three';
import {OBB} from '@gd/OBB';
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
  FunctionVector3,
  IDataString
} from '@gd/INamedValues';
import {
  isDataElement,
  MirrorError,
  Elements,
  NodeID,
  IElement,
  isElement,
  IDataElement,
  assignMeta,
  isMirror
} from '../IElements';
import {
  Joint,
  JointAsVector3,
  IAssembly,
  IDataAssembly,
  isAssembly,
  className
} from '../IElements/IAssembly';
import {Element, mirrorVec} from './ElementBase';
import {getElement} from '../Elements';

export class Assembly extends Element implements IAssembly {
  isAssembly = true as const;

  // eslint-disable-next-line class-methods-use-this
  get className(): Elements {
    return className;
  }

  obb = new OBB();

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
      ignoreArrange: true,
      arrangeCollected: () => {
        this.arrange();
        const joints = [...this.joints];
        this.children.forEach((child) => {
          if (isAssembly(child)) {
            const asm = child.collectElements();
            joints.push(...asm.joints);
          }
        });
        return joints;
      }
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

  // eslint-disable-next-line class-methods-use-this
  getForceResults(): {
    name: string;
    point: Vector3;
    force: Vector3;
    nodeID: string;
  }[] {
    return [];
  }

  // eslint-disable-next-line class-methods-use-this
  setCenterOfGravityAuto() {}

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
    if (this.arrangeCollected) {
      this.joints = this.arrangeCollected();
      return;
    }
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
      value: mass,
      update: () => {}
    });
  }

  // eslint-disable-next-line no-empty-function, class-methods-use-this
  set mass(m: NamedNumber) {}

  get centerOfGravity(): NamedVector3 {
    const center = new Vector3();
    const mass = this.mass.value;
    if (mass > 0) {
      this.children.forEach((child) => {
        center.add(
          child.centerOfGravity.value
            .clone()
            .applyQuaternion(child.rotation.value)
            .add(child.position.value)
            .multiplyScalar(child.mass.value)
        );
      });
      center.multiplyScalar(1 / mass);
    }
    return new NamedVector3({
      name: 'centerOfGravity',
      parent: this,
      value: center,
      nodeID: `${this.nodeID}cog`,
      update: () => {}
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

  arrangeCollected: (() => Joint[]) | undefined = undefined;

  constructor(
    params:
      | {
          name: string | IDataString;
          children: IElement[] | IDataElement[];
          joints: Joint[];
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          ignoreArrange?: boolean;
          arrangeCollected?: () => Joint[];
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
      if (params.arrangeCollected)
        this.arrangeCollected = params.arrangeCollected;
      this._children = params.children.map((e) =>
        isDataElement(e) ? getElement(e) : e
      );
      this.joints = params.joints;
      if (!params.ignoreArrange) {
        // collectedAssmblyでは実行しないため
        this._children.forEach((child) => {
          child.parent = this;
        });
        this.arrange();
      }
    }
  }

  getDataElement(): IDataAssembly | undefined {
    const original = this.syncMirror();
    const baseData = super.getDataElementBase(original);
    return {
      ...baseData,
      isDataAssembly: true,
      children: this.children
        .map((child) => child.getDataElement())
        .filter((child) => child !== undefined) as IDataElement[],
      joints: this.joints.map((joint) => {
        return {lhs: joint.lhs, rhs: joint.rhs};
      })
    };
  }

  syncMirror() {
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const original = this.getAnotherElement(mirror);
    if (!original || !isAssembly(original)) return null;
    if (!isMirror(this.parent) && original.parent !== this.parent) return null;

    const myChildren = this.children.reduce((prev, x) => {
      const to = x.meta?.mirror?.to;
      if (!to) throw new Error('なぜかミラー設定されていない');
      prev[to] = x;
      return prev;
    }, {} as {[name: string]: IElement});

    let pointsNodeIDs: string[] = [];
    this.children = original.children.map((originalChild) => {
      const myChild =
        myChildren[originalChild.nodeID] ?? originalChild.getMirror();
      myChild.parent = this;
      myChild.syncMirror();
      pointsNodeIDs = [...pointsNodeIDs, ...myChild.getPointsNodeIDs()];
      return myChild;
    });
    // .filter((child) => child !== undefined) as IDataElement[];

    const originalPoints = original.getAllPointsNodeIDsOfChildren();

    this.joints = original.joints.map((joint) => ({
      lhs: pointsNodeIDs[originalPoints.findIndex((p) => p === joint.lhs)],
      rhs: pointsNodeIDs[originalPoints.findIndex((p) => p === joint.rhs)]
    }));
    return original;
  }
}
