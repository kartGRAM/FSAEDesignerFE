/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import {Vector3, Quaternion} from 'three';
import * as THREE from 'three';
import {
  NamedVector3,
  NamedMatrix3,
  NamedQuaternion,
  NamedString,
  NamedNumber,
  NamedBooleanOrUndefined,
  isDeltaXYZ,
  isDirectionLength
} from '@gd/NamedValues';
import {
  INamedNumber,
  IDataNumber,
  IDataVector3,
  INamedVector3,
  // isNamedVector3,
  INamedMatrix3,
  FunctionVector3,
  IPointOffsetTool
} from '@gd/INamedValues';

import {AtLeast1, AtLeast2} from '@app/utils/atLeast';
import {v4 as uuidv4} from 'uuid';
import {GDState} from '@store/reducers/dataGeometryDesigner';
import {minus} from '@app/utils/helpers';
import {getIntersectionLineFromTwoPlanes} from '@utils/threeUtils';
import {getRootNode} from './INode';
import {
  trans,
  isBodyOfFrame,
  MirrorError,
  Elements,
  Joint,
  JointAsVector3,
  NodeID,
  IElement,
  isElement,
  isBody,
  isTire,
  isBellCrank,
  isAArm,
  isBar,
  IDataElement,
  IAssembly,
  IDataAssembly,
  isAssembly,
  isDataAssembly,
  isDataFrame,
  IDataFrame,
  IBar,
  IDataBar,
  isDataBar,
  ISpringDumper,
  IDataSpringDumper,
  isDataSpringDumper,
  IAArm,
  IDataAArm,
  isDataAArm,
  IBellCrank,
  IDataBellCrank,
  isDataBellCrank,
  IBody,
  IDataBody,
  isDataBody,
  ILinearBushing,
  IDataLinearBushing,
  isLinearBushing,
  isDataLinearBushing,
  ITire,
  IDataTire,
  isDataTire,
  Meta,
  assignMeta,
  isMirror
} from './IElements';

export function getAssembly(assembly: IDataAssembly): IAssembly {
  return getElement(assembly) as IAssembly;
}

export function getNewElement(name: Elements): IElement {
  if (name === 'Assembly') {
    return new Assembly({name: 'newAssembly', children: [], joints: []});
  }
  if (name === 'Frame') {
    return new Frame({name: 'newFrame', children: []});
  }
  if (name === 'Bar') {
    return new Bar({
      name: 'newBar',
      fixedPoint: new Vector3(0, 0, 0),
      point: new Vector3(0, 200, 0)
    });
  }
  if (name === 'SpringDumper') {
    return new SpringDumper({
      name: 'newSpringDumper',
      fixedPoint: new Vector3(0, 0, 0),
      point: new Vector3(0, 200, 0),
      dlMin: 0,
      dlMax: 50
    });
  }
  if (name === 'AArm') {
    return new AArm({
      name: 'newAArm',
      fixedPoints: [new Vector3(0, 0, 0), new Vector3(200, 0, 0)],
      points: [new Vector3(0, 200, 0)]
    });
  }
  if (name === 'BellCrank') {
    return new BellCrank({
      name: 'newBellCrank',
      fixedPoints: [new Vector3(-50, 0, 0), new Vector3(50, 0, 0)],
      points: [new Vector3(0, 100, 0), new Vector3(0, 0, 100)]
    });
  }
  if (name === 'Body') {
    return new Body({
      name: 'newBody',
      fixedPoints: [],
      points: []
    });
  }
  if (name === 'Tire') {
    return new Tire({
      name: 'newTire',
      tireCenter: new Vector3(0, 0, 220),
      toLeftBearing: -30,
      toRightBearing: -60
    });
  }
  if (name === 'LinearBushing') {
    return new LinearBushing({
      name: 'newLinearBushing',
      fixedPoints: [new Vector3(0, 0, 0), new Vector3(0, 200, 0)],
      toPoints: [150],
      dlMin: -50,
      dlMax: 50
    });
  }
  throw Error('Not Supported Exception');
}

function getElement(element: IDataElement): IElement {
  if (isDataAssembly(element)) {
    if (isDataFrame(element)) {
      return new Frame(element);
    }
    return new Assembly(element);
  }
  if (isDataSpringDumper(element)) {
    return new SpringDumper(element);
  }
  if (isDataBar(element)) {
    return new Bar(element);
  }
  if (isDataAArm(element)) {
    return new AArm(element);
  }
  if (isDataBellCrank(element)) {
    return new BellCrank(element);
  }
  if (isDataBody(element)) {
    return new Body(element);
  }
  if (isDataTire(element)) {
    return new Tire(element);
  }
  if (isDataLinearBushing(element)) {
    return new LinearBushing(element);
  }
  throw Error('Not Supported Exception');
}

export abstract class Element implements IElement {
  meta?: Meta;

  isElement = true as const;

  _nodeID: string;

  getName(): string {
    return this.name.value;
  }

  getNamedAbsPath(): string {
    return `${this.getName()}${
      this.parent ? `@${this.parent.getNamedAbsPath()}` : ''
    }`;
  }

  name: NamedString;

  parent: IAssembly | null = null;

  get absPath(): string {
    return `${this.nodeID}${this.parent ? `@${this.parent.absPath}` : ''}`;
  }

  get nodeID(): string {
    return this._nodeID;
  }

  getRoot(): IAssembly | null {
    const root = getRootNode(this);
    if (root) {
      if (isElement(root) && isAssembly(root)) return root;
    }
    return null;
    // let assembly: IAssembly | null = this.parent;
    // if (assembly) {
    // while (assembly.parent !== null) {
    // assembly = assembly.parent;
    // }
    // } else if (isAssembly(this)) return this;
    // return assembly;
  }

  protected getAnotherElement(
    nodeID: string | undefined | null
  ): IElement | null {
    if (nodeID) {
      const root = this.getRoot();
      const element = root
        ?.flatten(false)
        .find((child) => child.nodeID === nodeID);
      return element ?? null;
    }
    return null;
  }

  constructor(params: {name: string} | IDataElement) {
    this._nodeID = uuidv4(); // ⇨ '2c5ea4c0-4067-11e9-8bad-9b1deb4d3b7d'
    const {name} = params;
    this.name = new NamedString({
      name: 'name',
      value: name,
      parent: this
    });
    if (isDataElement(params)) {
      const element = params;
      this._nodeID = element.nodeID;
      if (params.mirrorTo) {
        assignMeta(this, {mirror: {to: params.mirrorTo}});
      }
    }
  }

  getPointsNodeIDs(): string[] {
    return this.getPoints().map((p) => p.nodeID);
  }

  abstract getPoints(): INamedVector3[];

  getMeasurablePoints(): INamedVector3[] {
    const points = this.getPoints();
    return [...points, this.centerOfGravity];
  }

  abstract getMirror(): IElement;

  unlinkMirror(): void {
    if (!isMirror(this)) return;
    if (this.parent && isMirror(this.parent)) {
      this.parent.unlinkMirror();
      return;
    }
    this.unlinkMirrorHelper();
  }

  private unlinkMirrorHelper(): void {
    if (this.meta?.mirror) {
      this.meta.mirror = undefined;
      if (isAssembly(this)) {
        this.children.forEach((child) => child.unlinkMirror());
      }
    }
  }

  abstract getDataElement(state: GDState): IDataElement | undefined;

  abstract arrange(parentPosition?: Vector3 | undefined): void;

  abstract get rotation(): NamedQuaternion;

  abstract set rotation(q: NamedQuaternion);

  abstract get className(): Elements;

  abstract get visible(): NamedBooleanOrUndefined;

  abstract set visible(b: NamedBooleanOrUndefined);

  abstract get mass(): NamedNumber;

  abstract set mass(m: NamedNumber);

  abstract get position(): NamedVector3;

  abstract set position(p: NamedVector3);

  abstract get initialPosition(): NamedVector3;

  abstract set initialPosition(p: NamedVector3);

  abstract get centerOfGravity(): NamedVector3;

  abstract set centerOfGravity(v: NamedVector3);

  abstract get inertialTensor(): NamedMatrix3;

  abstract set inertialTensor(mat: NamedMatrix3);

  getDataElementBase(
    state: GDState,
    mirrorElement: IElement | null
  ): IDataElement {
    if (!mirrorElement) {
      return {
        isDataElement: true,
        className: this.className,
        name: this.name.getData(state),
        nodeID: this.nodeID,
        absPath: this.absPath,

        inertialTensor: this.inertialTensor.getData(state),
        centerOfGravity: this.centerOfGravity.getData(state),
        mass: this.mass.getData(state),
        position: this.position.getData(state),
        rotation: this.rotation.getData(state),
        initialPosition: this.initialPosition.getData(state),
        visible: this.visible.getData()
        // mirrorTo: this.meta?.mirror?.to
      };
    }
    this.name.value = `mirror_${mirrorElement.name.value}`;
    return {
      isDataElement: true,
      className: this.className,
      name: this.name.getData(state),
      nodeID: this.nodeID,
      absPath: this.absPath,

      inertialTensor: mirrorMat(mirrorElement.inertialTensor).getData(state),
      centerOfGravity: this.centerOfGravity
        .setValue(mirrorVec(mirrorElement.centerOfGravity))
        .getData(state),
      mass: this.mass.setValue(mirrorElement.mass).getData(state),
      position: this.position.getData(state),
      rotation: this.rotation.getData(state),
      initialPosition: this.initialPosition
        .setValue(mirrorVec(mirrorElement.initialPosition))
        .getData(state),
      visible: this.visible.getData(),
      mirrorTo: mirrorElement.nodeID
    };
  }
}

export class Assembly extends Element implements IAssembly {
  isAssembly = true as const;

  get className(): Elements {
    return 'Assembly' as const;
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

  get position(): NamedVector3 {
    return new NamedVector3({name: 'position', parent: this});
  }

  set position(p: NamedVector3) {
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

  getAllPointsOfChildren(): INamedVector3[] {
    let points: INamedVector3[] = [];
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

  getPoints(): INamedVector3[] {
    let points: INamedVector3[] = [];
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

  getJointedPoints(): INamedVector3[] {
    let points: INamedVector3[] = [];
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

  // eslint-disable-next-line no-empty-function
  set mass(m: NamedNumber) {}

  get centerOfGravity(): NamedVector3 {
    const center = new Vector3();
    this.children.forEach((child) => {
      center.add(child.position.value.clone().multiplyScalar(child.mass.value));
    });
    return new NamedVector3({
      name: 'centerOfGravity',
      parent: this,
      value: center
    });
  }

  // eslint-disable-next-line no-empty-function
  set centerOfGravity(v: NamedVector3) {}

  get inertialTensor(): NamedMatrix3 {
    return new NamedMatrix3({
      parent: this,
      name: 'inertialTensor'
    });
  }

  // eslint-disable-next-line no-empty-function
  set inertialTensor(mat: NamedMatrix3) {}

  // eslint-disable-next-line no-empty-function
  get rotation(): NamedQuaternion {
    return new NamedQuaternion({
      parent: this,
      name: 'rotation'
    });
  }

  // eslint-disable-next-line no-empty-function
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

export class Frame extends Assembly {
  get className(): Elements {
    return 'Frame' as const;
  }

  readonly frameBody: IBody;

  constructor(
    params:
      | {
          name: string;
          children: IElement[];
          initialPosition?: FunctionVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3;
        }
      | IDataFrame
  ) {
    if (!isDataElement(params)) {
      const {name, children, initialPosition, mass, centerOfGravity} = params;
      const namedPoints = children.reduce((prev: INamedVector3[], child) => {
        prev = [
          ...prev,
          ...child.getPoints().filter((p) => !p.meta.isFreeNode)
        ];
        return prev;
      }, [] as INamedVector3[]);
      const points = namedPoints.map((p) => trans(p));
      const body = new Body({
        name: `bodyObject_${name}`,
        fixedPoints: points,
        points: [],
        initialPosition,
        mass,
        centerOfGravity
      });
      assignMeta(body, {isBodyOfFrame: true});
      const joints = namedPoints.map((p, i) => ({
        lhs: p.nodeID,
        rhs: body.fixedPoints[i].nodeID
      }));
      super({name, children: [...children, body], joints});
      this.frameBody = body;
    } else {
      super(params);
      const body = this.children.find(
        (child) => child.nodeID === params.bodyID
      );
      if (body && isBody(body)) {
        assignMeta(body, {isBodyOfFrame: true});
        this.frameBody = body;
        const namedPoints = this.children.reduce(
          (prev: INamedVector3[], child) => {
            if (child === body) return prev;
            prev = [
              ...prev,
              ...child.getPoints().filter((p) => !p.meta.isFreeNode)
            ];
            return prev;
          },
          [] as INamedVector3[]
        );
        body.fixedPoints.splice(0);
        body.fixedPoints.push(
          ...namedPoints.map(
            (p, i) =>
              new NamedVector3({
                name: `fixedPoint${i + 1}`,
                parent: body,
                value: trans(p)
              })
          )
        );
        this.joints = namedPoints.map((p, i) => ({
          lhs: p.nodeID,
          rhs: body.fixedPoints[i].nodeID
        }));
      } else {
        throw new Error('FrameのChildrenにBodyデータがない');
      }
    }
  }

  getDataElement(state: GDState): IDataFrame | undefined {
    const data = super.getDataElement(state);
    if (!data) return undefined;
    return {...data, bodyID: this.frameBody.nodeID};
  }
}

export class Bar extends Element implements IBar {
  get className(): Elements {
    return 'Bar';
  }

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  fixedPoint: NamedVector3;

  point: NamedVector3;

  initialPosition: NamedVector3;

  position: NamedVector3;

  rotation: NamedQuaternion;

  get length(): number {
    return this.fixedPoint.value.sub(this.point.value).length();
  }

  getPoints(): INamedVector3[] {
    return [this.fixedPoint, this.point];
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
    this.rotation.value = new Quaternion();
  }

  getMirror(): Bar {
    if (isMirror(this)) throw new MirrorError('ミラーはミラーできない');
    const fp = mirrorVec(this.fixedPoint);
    const p = mirrorVec(this.point);
    const ip = mirrorVec(this.initialPosition);
    const cog = mirrorVec(this.centerOfGravity);
    const ret = new Bar({
      name: `mirror_${this.name.value}`,
      fixedPoint: fp,
      point: p,
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog
    });
    assignMeta(ret, {mirror: {to: this.nodeID}});
    return ret;
  }

  get inertialTensor(): NamedMatrix3 {
    return new NamedMatrix3({
      parent: this,
      name: 'inertialTensor'
    });
  }

  set inertialTensor(mat: NamedMatrix3) {
    // throw Error('Not Supported Exception');
  }

  constructor(
    params:
      | {
          name: string;
          fixedPoint: FunctionVector3 | IDataVector3 | INamedVector3;
          point: FunctionVector3 | IDataVector3 | INamedVector3;
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3 | IDataVector3 | INamedVector3;
        }
      | IDataBar
  ) {
    super(params);
    const {fixedPoint, point, initialPosition, mass, centerOfGravity} = params;

    this.fixedPoint = new NamedVector3({
      name: 'fixedPoint',
      parent: this,
      value: fixedPoint
    });
    this.point = new NamedVector3({
      name: 'point',
      parent: this,
      value: point
    });

    this.visible = new NamedBooleanOrUndefined({
      name: 'visible',
      parent: this,
      value: isDataElement(params) ? params.visible : true
    });
    this.initialPosition = new NamedVector3({
      name: 'initialPosition',
      parent: this,
      value: initialPosition ?? new Vector3()
    });
    this.mass = new NamedNumber({
      name: 'mass',
      parent: this,
      value: mass ?? 0.001
    });
    this.centerOfGravity = new NamedVector3({
      name: 'centerOfGravity',
      parent: this,
      value: centerOfGravity ?? new Vector3()
    });
    this.position = new NamedVector3({
      name: 'position',
      parent: this,
      value: isDataElement(params)
        ? params.position
        : this.initialPosition.value
    });
    this.rotation = new NamedQuaternion({
      name: 'rotation',
      parent: this,
      value: isDataElement(params) ? params.rotation : new Quaternion()
    });
  }

  getDataElement(state: GDState): IDataBar {
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const mir = this.getAnotherElement(mirror);
    const baseData = super.getDataElementBase(state, mir);

    if (mir && isBar(mir)) {
      return {
        ...baseData,
        fixedPoint: this.fixedPoint
          .setValue(mirrorVec(mir.fixedPoint))
          .getData(state),
        point: this.point.setValue(mirrorVec(mir.point)).getData(state)
      };
    }
    return {
      ...baseData,
      fixedPoint: this.fixedPoint.getData(state),
      point: this.point.getData(state)
    };
  }
}

export class SpringDumper extends Bar implements ISpringDumper {
  get className(): Elements {
    return 'SpringDumper';
  }

  controllable = true as const;

  getMirror(): SpringDumper {
    if (isMirror(this)) throw new MirrorError('ミラーはミラーできない');
    const fp = mirrorVec(this.fixedPoint);
    const p = mirrorVec(this.point);
    const ip = mirrorVec(this.initialPosition);
    const cog = mirrorVec(this.centerOfGravity);
    const ret = new SpringDumper({
      name: `mirror_${this.name.value}`,
      fixedPoint: fp,
      point: p,
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog,
      dlMin: this.dlMin.value,
      dlMax: this.dlMax.value
    });
    assignMeta(ret, {mirror: {to: this.nodeID}});
    return ret;
  }

  dlMin: NamedNumber;

  dlMax: NamedNumber;

  dlCurrent: number = 0;

  get currentPoint() {
    const fp = this.fixedPoint.value;
    const p = this.point.value;
    p.sub(fp)
      .normalize()
      .multiplyScalar(this.length + this.dlCurrent)
      .add(fp);
    return p;
  }

  get isLimited() {
    return (
      Math.abs(this.dlCurrent - this.dlMin.value) < 1e-5 ||
      Math.abs(this.dlCurrent - this.dlMax.value) < 1e-5
    );
  }

  arrange(parentPosition?: Vector3) {
    this.dlCurrent = 0;
    super.arrange(parentPosition);
  }

  constructor(
    params:
      | {
          name: string;
          fixedPoint: FunctionVector3 | IDataVector3 | INamedVector3;
          point: FunctionVector3 | IDataVector3 | INamedVector3;
          dlMin: number;
          dlMax: number;
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3 | IDataVector3 | INamedVector3;
        }
      | IDataSpringDumper
  ) {
    super(params);
    this.dlMin = new NamedNumber({
      name: 'dlMin',
      parent: this,
      value: params.dlMin
    });
    this.dlMax = new NamedNumber({
      name: 'dlMax',
      parent: this,
      value: params.dlMax
    });
  }

  getDataElement(state: GDState): IDataSpringDumper {
    const baseData = super.getDataElement(state);
    const data: IDataSpringDumper = {
      ...baseData,
      dlMin: this.dlMin.getData(state),
      dlMax: this.dlMax.getData(state)
    };
    return data;
  }
}

export class AArm extends Element implements IAArm {
  get className(): Elements {
    return 'AArm';
  }

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  initialPosition: NamedVector3;

  position: NamedVector3;

  rotation: NamedQuaternion;

  fixedPoints: [NamedVector3, NamedVector3];

  points: AtLeast1<NamedVector3>;

  get centerOfPoints() {
    const {fixedPoints, points} = this;
    return new NamedVector3({
      name: 'center',
      parent: this,
      value: fixedPoints[0].value
        .add(fixedPoints[1].value)
        .add(points[0].value)
        .multiplyScalar(1 / 3)
    });
  }

  getPoints(): INamedVector3[] {
    return [...this.fixedPoints, ...this.points];
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
    this.rotation.value = new Quaternion();
  }

  getMirror(): AArm {
    if (isMirror(this)) throw new MirrorError('ミラーはミラーできない');
    const fp: [INamedVector3, INamedVector3] = [
      mirrorVec(this.fixedPoints[0]),
      mirrorVec(this.fixedPoints[1])
    ];
    const points = this.points.map((p) => mirrorVec(p));
    const ip = mirrorVec(this.initialPosition);
    const cog = mirrorVec(this.centerOfGravity);
    const point0 = points.shift()!;
    const ret = new AArm({
      name: `mirror_${this.name.value}`,
      fixedPoints: fp,
      points: [point0, ...points],
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog
    });
    assignMeta(ret, {mirror: {to: this.nodeID}});
    return ret;
  }

  get inertialTensor(): NamedMatrix3 {
    return new NamedMatrix3({
      parent: this,
      name: 'inertialTensor'
    });
  }

  set inertialTensor(mat: NamedMatrix3) {
    // throw Error('Not Supported Exception');
  }

  fixedPointNames = ['chassisFore', 'chassisAft'];

  pointNames = ['upright', 'attachedPoint'];

  constructor(
    params:
      | {
          name: string;
          fixedPoints: [
            FunctionVector3 | IDataVector3 | INamedVector3,
            FunctionVector3 | IDataVector3 | INamedVector3
          ];
          points: AtLeast1<FunctionVector3 | IDataVector3 | INamedVector3>;
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3 | IDataVector3 | INamedVector3;
        }
      | IDataAArm
  ) {
    super(params);
    const {fixedPoints, points, initialPosition, mass, centerOfGravity} =
      params;
    this.fixedPoints = [
      new NamedVector3({
        name: this.fixedPointNames[0],
        parent: this,
        value: fixedPoints[0]
      }),

      new NamedVector3({
        name: this.fixedPointNames[1],
        parent: this,
        value: fixedPoints[1]
      })
    ];
    const p = [...points];
    const point0 = p.shift()!;
    this.points = [
      new NamedVector3({
        name: this.pointNames[0],
        parent: this,
        value: point0
      }),
      ...p.map(
        (point, i) =>
          new NamedVector3({
            name: `${this.pointNames[1]}${i + 1}`,
            parent: this,
            value: point
          })
      )
    ];

    this.visible = new NamedBooleanOrUndefined({
      name: 'visible',
      parent: this,
      value: isDataElement(params) ? params.visible : true
    });
    this.initialPosition = new NamedVector3({
      name: 'initialPosition',
      parent: this,
      value: initialPosition ?? new Vector3()
    });
    this.mass = new NamedNumber({
      name: 'mass',
      parent: this,
      value: mass ?? 0.001
    });
    this.centerOfGravity = new NamedVector3({
      name: 'centerOfGravity',
      parent: this,
      value: centerOfGravity ?? new Vector3()
    });
    this.position = new NamedVector3({
      name: 'position',
      parent: this,
      value: isDataElement(params)
        ? params.position
        : this.initialPosition.value
    });
    this.rotation = new NamedQuaternion({
      name: 'rotation',
      parent: this,
      value: isDataElement(params) ? params.rotation : new Quaternion()
    });
  }

  getDataElement(state: GDState): IDataAArm {
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const mir = this.getAnotherElement(mirror);
    const baseData = super.getDataElementBase(state, mir);

    if (mir && isAArm(mir)) {
      return {
        ...baseData,
        fixedPoints: [
          this.fixedPoints[0]
            .setValue(mirrorVec(mir.fixedPoints[0]))
            .getData(state),
          this.fixedPoints[1]
            .setValue(mirrorVec(mir.fixedPoints[1]))
            .getData(state)
        ],
        points: syncPointsMirror(this.points, mir.points, state)
      };
    }
    return {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => point.getData(state)),
      points: this.points.map((point) => point.getData(state))
    };
  }
}

export class BellCrank extends Element implements IBellCrank {
  get className(): Elements {
    return 'BellCrank';
  }

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  fixedPoints: [NamedVector3, NamedVector3];

  points: AtLeast2<NamedVector3>;

  initialPosition: NamedVector3;

  position: NamedVector3;

  rotation: NamedQuaternion;

  getPoints(): INamedVector3[] {
    return [...this.fixedPoints, ...this.points];
  }

  get centerOfPoints() {
    const {fixedPoints, points} = this;
    return new NamedVector3({
      name: 'center',
      parent: this,
      value: fixedPoints[0].value
        .add(fixedPoints[1].value)
        .add(points[0].value)
        .add(points[1].value)
        .multiplyScalar(0.25)
    });
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
    this.rotation.value = new Quaternion();
  }

  getMirror(): BellCrank {
    if (isMirror(this)) throw new MirrorError('ミラーはミラーできない');
    const fp: [INamedVector3, INamedVector3] = [
      mirrorVec(this.fixedPoints[0]),
      mirrorVec(this.fixedPoints[1])
    ];
    const points = this.points.map((p) => mirrorVec(p));
    const point0 = points.shift()!;
    const point1 = points.shift()!;
    const ip = mirrorVec(this.initialPosition);
    const cog = mirrorVec(this.centerOfGravity);
    const ret = new BellCrank({
      name: `mirror_${this.name.value}`,
      fixedPoints: fp,
      points: [point0, point1, ...points],
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog
    });
    assignMeta(ret, {mirror: {to: this.nodeID}});
    return ret;
  }

  get inertialTensor(): NamedMatrix3 {
    return new NamedMatrix3({
      parent: this,
      name: 'inertialTensor'
    });
  }

  set inertialTensor(mat: NamedMatrix3) {
    // throw Error('Not Supported Exception');
  }

  fixedPointNames = ['pivot1', 'pivot2'];

  pointNames = ['coilover', 'rod', 'attachment'];

  constructor(
    params:
      | {
          name: string;
          fixedPoints: [
            FunctionVector3 | IDataVector3 | INamedVector3,
            FunctionVector3 | IDataVector3 | INamedVector3
          ];
          points: AtLeast2<FunctionVector3 | IDataVector3 | INamedVector3>;
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3 | IDataVector3 | INamedVector3;
        }
      | IDataBellCrank
  ) {
    super(params);
    const {fixedPoints, points, initialPosition, mass, centerOfGravity} =
      params;
    this.fixedPoints = [
      new NamedVector3({
        name: this.fixedPointNames[0],
        parent: this,
        value: fixedPoints[0]
      }),

      new NamedVector3({
        name: this.fixedPointNames[1],
        parent: this,
        value: fixedPoints[1]
      })
    ];
    const p = [...points];
    const point0 = p.shift()!;
    const point1 = p.shift()!;
    this.points = [
      new NamedVector3({
        name: this.pointNames[0],
        parent: this,
        value: point0
      }),
      new NamedVector3({
        name: this.pointNames[1],
        parent: this,
        value: point1
      }),
      ...p.map(
        (point, i) =>
          new NamedVector3({
            name: `${this.pointNames[2]}${i + 1}`,
            parent: this,
            value: point
          })
      )
    ];

    this.visible = new NamedBooleanOrUndefined({
      name: 'visible',
      parent: this,
      value: isDataElement(params) ? params.visible : true
    });
    this.initialPosition = new NamedVector3({
      name: 'initialPosition',
      parent: this,
      value: initialPosition ?? new Vector3()
    });
    this.mass = new NamedNumber({
      name: 'mass',
      parent: this,
      value: mass ?? 0.001
    });
    this.centerOfGravity = new NamedVector3({
      name: 'centerOfGravity',
      parent: this,
      value: centerOfGravity ?? new Vector3()
    });
    this.position = new NamedVector3({
      name: 'position',
      parent: this,
      value: isDataElement(params)
        ? params.position
        : this.initialPosition.value
    });
    this.rotation = new NamedQuaternion({
      name: 'rotation',
      parent: this,
      value: isDataElement(params) ? params.rotation : new Quaternion()
    });
  }

  getDataElement(state: GDState): IDataBellCrank {
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const mir = this.getAnotherElement(mirror);
    const baseData = super.getDataElementBase(state, mir);

    if (mir && isBellCrank(mir)) {
      return {
        ...baseData,
        fixedPoints: [
          this.fixedPoints[0]
            .setValue(mirrorVec(mir.fixedPoints[0]))
            .getData(state),
          this.fixedPoints[1]
            .setValue(mirrorVec(mir.fixedPoints[1]))
            .getData(state)
        ],
        points: syncPointsMirror(this.points, mir.points, state)
      };
    }
    return {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => point.getData(state)),
      points: this.points.map((point) => point.getData(state))
    };
  }
}

export class Body extends Element implements IBody {
  get className(): Elements {
    return 'Body';
  }

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  fixedPoints: Array<NamedVector3>;

  points: Array<NamedVector3>;

  initialPosition: NamedVector3;

  position: NamedVector3;

  rotation: NamedQuaternion;

  getPoints(): INamedVector3[] {
    return [...this.fixedPoints, ...this.points];
  }

  get centerOfPoints() {
    const {fixedPoints, points} = this;
    const c = new Vector3();
    this.points.forEach((p) => c.add(p.value));
    this.fixedPoints.forEach((p) => c.add(p.value));
    if (points.length || fixedPoints.length) {
      c.multiplyScalar(1 / (points.length + fixedPoints.length));
    }

    return new NamedVector3({
      name: 'center',
      parent: this,
      value: c
    });
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
    this.rotation.value = new Quaternion();
  }

  getMirror(): Body {
    if (isMirror(this)) throw new MirrorError('ミラーはミラーできない');
    const fp = this.fixedPoints.map((p) => mirrorVec(p));
    const points = this.points.map((p) => mirrorVec(p));
    const ip = mirrorVec(this.initialPosition);
    const cog = mirrorVec(this.centerOfGravity);
    const ret = new Body({
      name: `mirror_${this.name.value}`,
      fixedPoints: fp,
      points,
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog
    });
    assignMeta(ret, {mirror: {to: this.nodeID}});
    return ret;
  }

  get inertialTensor(): NamedMatrix3 {
    return new NamedMatrix3({
      parent: this,
      name: 'inertialTensor'
    });
  }

  set inertialTensor(mat: NamedMatrix3) {
    // throw Error('Not Supported Exception');
  }

  constructor(
    params:
      | {
          name: string;
          fixedPoints: Array<FunctionVector3 | IDataVector3 | INamedVector3>;
          points: Array<FunctionVector3 | IDataVector3 | INamedVector3>;
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3 | IDataVector3 | INamedVector3;
        }
      | IDataBody
  ) {
    super(params);
    const {fixedPoints, points, initialPosition, mass, centerOfGravity} =
      params;
    this.fixedPoints = fixedPoints.map(
      (point, i) =>
        new NamedVector3({
          name: `fixedPoint${i + 1}`,
          parent: this,
          value: point
        })
    );
    this.points = points.map(
      (point, i) =>
        new NamedVector3({
          name: `point${i + 1}`,
          parent: this,
          value: point
        })
    );

    this.visible = new NamedBooleanOrUndefined({
      name: 'visible',
      parent: this,
      value: isDataElement(params) ? params.visible : true
    });
    this.initialPosition = new NamedVector3({
      name: 'initialPosition',
      parent: this,
      value: initialPosition ?? new Vector3()
    });
    this.mass = new NamedNumber({
      name: 'mass',
      parent: this,
      value: mass ?? 0.001
    });
    this.centerOfGravity = new NamedVector3({
      name: 'centerOfGravity',
      parent: this,
      value: centerOfGravity ?? new Vector3()
    });
    this.position = new NamedVector3({
      name: 'position',
      parent: this,
      value: isDataElement(params)
        ? params.position
        : this.initialPosition.value
    });
    this.rotation = new NamedQuaternion({
      name: 'rotation',
      parent: this,
      value: isDataElement(params) ? params.rotation : new Quaternion()
    });
  }

  getDataElement(state: GDState): IDataBody {
    const bIsBodyOfFrame = isBodyOfFrame(this);
    if (bIsBodyOfFrame) {
      this.name.value = `bodyObject_${this.parent?.name.value}`;
    }
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const mir = this.getAnotherElement(mirror);
    const baseData = super.getDataElementBase(state, mir);

    if (mir && isBody(mir)) {
      return {
        ...baseData,
        fixedPoints: syncPointsMirror(this.fixedPoints, mir.fixedPoints, state),
        points: syncPointsMirror(this.points, mir.points, state),
        isBodyOfFrame: bIsBodyOfFrame
      };
    }
    return {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => point.getData(state)),
      points: this.points.map((point) => point.getData(state)),
      isBodyOfFrame: bIsBodyOfFrame
    };
  }
}

export class Tire extends Element implements ITire {
  get className(): Elements {
    return 'Tire';
  }

  hasNearestNeighborToPlane = true as const;

  getNearestNeighborToPlane(normal: Vector3): Vector3 {
    const n = normal.clone().normalize();
    // タイヤの軸の方向ベクトル
    const axis = new Vector3(0, 1, 0);
    // 平面に平行なベクトル...②
    const g = axis.clone().cross(n);
    const r = this.radius;

    // ②を軸にaxisを90度回転した単位ベクトルに、半径をかけた点が最近傍点
    const q = new Quaternion().setFromAxisAngle(g, -Math.PI / 2);
    const p = (
      g.lengthSq() < Number.EPSILON * 2 ** 8
        ? new Vector3(0, 0, -1)
        : axis.applyQuaternion(q)
    ).multiplyScalar(r);
    return p.add(this.tireCenter.value);
  }

  leftBearingNodeID: string;

  rightBearingNodeID: string;

  groundingPointNodeID: string;

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  tireCenter: NamedVector3;

  toLeftBearing: NamedNumber;

  toRightBearing: NamedNumber;

  initialPosition: NamedVector3;

  position: NamedVector3;

  get radius(): number {
    return this.tireCenter.value.z;
  }

  rotation: NamedQuaternion;

  /* UpdateMethodが適当。直す必要あり */
  get leftBearing(): NamedVector3 {
    return new NamedVector3({
      name: 'leftBaring',
      parent: this,
      value: this.tireCenter.originalValue.add(
        new Vector3(0, this.toLeftBearing.value, 0)
      ),
      update: () => {},
      nodeID: this.leftBearingNodeID
    });
  }

  /* 直す必要あり */
  get rightBearing(): NamedVector3 {
    return new NamedVector3({
      name: 'rightBaring',
      parent: this,
      value: this.tireCenter.originalValue.add(
        new Vector3(0, this.toRightBearing.value, 0)
      ),
      update: () => {},
      nodeID: this.rightBearingNodeID
    });
  }

  get bearingDistance(): number {
    return Math.abs(this.toLeftBearing.value - this.toRightBearing.value);
  }

  get ground(): Vector3 {
    return this.tireCenter.value
      .clone()
      .add(new Vector3(0, -this.tireCenter.value.y, 0));
  }

  getPoints(): INamedVector3[] {
    return [this.leftBearing, this.rightBearing];
  }

  getMeasurablePoints(): INamedVector3[] {
    const points = super.getMeasurablePoints();
    const normal = new Vector3(0, 1, 0).applyQuaternion(this.rotation.value);
    const center = this.tireCenter.value;
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      normal,
      center
    );
    const ground = new THREE.Plane(new Vector3(0, 0, 1), 0);
    const line = getIntersectionLineFromTwoPlanes(plane, ground);
    const gPoint = line
      .closestPointToPoint(center, false, new Vector3())
      .sub(center)
      .normalize()
      .multiplyScalar(this.diameter / 2)
      .add(center);
    const gPointNamed = new NamedVector3({
      name: 'groundingPoint',
      parent: this,
      value: gPoint,
      update: () => {},
      nodeID: this.groundingPointNodeID
    });

    return [...points, gPointNamed, this.tireCenter];
  }

  getPointsNodeIDs(): string[] {
    return [this.leftBearingNodeID, this.rightBearingNodeID];
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
    this.rotation.value = new Quaternion();
  }

  getMirror(): Tire {
    if (isMirror(this)) throw new MirrorError('ミラーはミラーできない');
    const center = mirrorVec(this.tireCenter);
    const ip = mirrorVec(this.initialPosition);
    const cog = mirrorVec(this.centerOfGravity);
    const ret = new Tire({
      name: `mirror_${this.name.value}`,
      tireCenter: center,
      toLeftBearing: minus(this.toRightBearing.getStringValue()),
      toRightBearing: minus(this.toLeftBearing.getStringValue()),
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog
    });
    assignMeta(ret, {mirror: {to: this.nodeID}});
    return ret;
  }

  get diameter(): number {
    return this.tireCenter.value.z * 2.0;
  }

  get inertialTensor(): NamedMatrix3 {
    return new NamedMatrix3({name: 'inertialTensor', parent: this});
  }

  set inertialTensor(mat: NamedMatrix3) {
    // throw Error('Not Supported Exception');
  }

  constructor(
    params:
      | {
          name: string;
          tireCenter: FunctionVector3 | IDataVector3 | INamedVector3;
          toLeftBearing: number | string;
          toRightBearing: number | string;
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3 | IDataVector3 | INamedVector3;
        }
      | IDataTire
  ) {
    super(params);
    const {
      tireCenter,
      toLeftBearing,
      toRightBearing,
      initialPosition,
      mass,
      centerOfGravity
    } = params;

    this.leftBearingNodeID = uuidv4();
    this.rightBearingNodeID = uuidv4();
    this.groundingPointNodeID = uuidv4();
    if (isDataElement(params)) {
      this.leftBearingNodeID = params.leftBearingNodeID;
      this.rightBearingNodeID = params.rightBearingNodeID;
      this.groundingPointNodeID = params.groundingPointNodeID;
    }

    this.tireCenter = new NamedVector3({
      name: 'tireCenter',
      parent: this,
      value: tireCenter ?? new Vector3()
    });

    this.toLeftBearing = new NamedNumber({
      name: 'toLeftBearing',
      parent: this,
      value: toLeftBearing
    });
    this.toRightBearing = new NamedNumber({
      name: 'toRightBearing',
      parent: this,
      value: toRightBearing
    });

    this.visible = new NamedBooleanOrUndefined({
      name: 'visible',
      parent: this,
      value: isDataElement(params) ? params.visible : true
    });
    this.initialPosition = new NamedVector3({
      name: 'initialPosition',
      parent: this,
      value: initialPosition ?? new Vector3()
    });
    this.mass = new NamedNumber({
      name: 'mass',
      parent: this,
      value: mass ?? 0.001
    });
    this.centerOfGravity = new NamedVector3({
      name: 'centerOfGravity',
      parent: this,
      value: centerOfGravity ?? new Vector3()
    });
    this.position = new NamedVector3({
      name: 'position',
      parent: this,
      value: isDataElement(params)
        ? params.position
        : this.initialPosition.value
    });
    this.rotation = new NamedQuaternion({
      name: 'rotation',
      parent: this,
      value: isDataElement(params) ? params.rotation : new Quaternion()
    });
  }

  getDataElement(state: GDState): IDataTire {
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const mir = this.getAnotherElement(mirror);
    const baseData = super.getDataElementBase(state, mir);

    if (mir && isTire(mir)) {
      return {
        ...baseData,
        tireCenter: this.tireCenter
          .setValue(mirrorVec(mir.tireCenter))
          .getData(state),
        toLeftBearing: this.toLeftBearing
          .setValue(minus(mir.toLeftBearing.getStringValue()))
          .getData(state),
        toRightBearing: this.toRightBearing
          .setValue(minus(mir.toRightBearing.getStringValue()))
          .getData(state),
        leftBearingNodeID: this.leftBearingNodeID,
        rightBearingNodeID: this.rightBearingNodeID,
        groundingPointNodeID: this.groundingPointNodeID
      };
    }
    return {
      ...baseData,
      tireCenter: this.tireCenter.getData(state),
      toLeftBearing: this.toLeftBearing.getData(state),
      toRightBearing: this.toRightBearing.getData(state),
      leftBearingNodeID: this.leftBearingNodeID,
      rightBearingNodeID: this.rightBearingNodeID,
      groundingPointNodeID: this.groundingPointNodeID
    };
  }
}

export class LinearBushing extends Element implements ILinearBushing {
  get className(): Elements {
    return 'LinearBushing';
  }

  controllable = true as const;

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  initialPosition: NamedVector3;

  position: NamedVector3;

  rotation: NamedQuaternion;

  fixedPoints: [NamedVector3, NamedVector3];

  toPoints: AtLeast1<NamedNumber>;

  dlMin: NamedNumber;

  dlMax: NamedNumber;

  dlCurrent: number = 0;

  get currentPoints() {
    const fp = this.fixedPoints.map((p) => p.value);
    const toP = this.toPoints.map((to) => to.value);
    const center = fp[0].clone().add(fp[1]).multiplyScalar(0.5);
    const dir = fp[1].clone().sub(fp[0]).normalize();
    return toP.map((to) =>
      center.clone().add(dir.clone().multiplyScalar(to + this.dlCurrent))
    );
  }

  get isLimited() {
    return (
      Math.abs(this.dlCurrent - this.dlMin.value) < 1e-5 ||
      Math.abs(this.dlCurrent - this.dlMax.value) < 1e-5
    );
  }

  get points(): INamedVector3[] {
    const fp = this.fixedPoints.map((p) => p.value);
    const center = fp[0].clone().add(fp[1]).multiplyScalar(0.5);
    const dir = fp[1].clone().sub(fp[0]).normalize();
    const points = this.toPoints.map(
      (to, i) =>
        new NamedVector3({
          name: `rodEnd${i}`,
          parent: this,
          value: center.clone().add(dir.clone().multiplyScalar(to.value)),
          update: () => {},
          nodeID: `${to.nodeID}_points`
        })
    );
    return points;
  }

  get supportDistance(): number {
    const fp = this.fixedPoints.map((p) => p.value);
    return fp[1].clone().sub(fp[0]).length();
  }

  getPoints(): INamedVector3[] {
    return [...this.fixedPoints, ...this.points];
  }

  arrange(parentPosition?: Vector3) {
    this.dlCurrent = 0;
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
    this.rotation.value = new Quaternion();
  }

  getMirror(): LinearBushing {
    if (isMirror(this)) throw new MirrorError('ミラーはミラーできない');
    const fp: [INamedVector3, INamedVector3] = [
      mirrorVec(this.fixedPoints[0]),
      mirrorVec(this.fixedPoints[1])
    ];
    const toPoints = this.toPoints.map((p) => minus(p.getStringValue()));
    const ip = mirrorVec(this.initialPosition);
    const cog = mirrorVec(this.centerOfGravity);
    const toPoint0 = toPoints.shift()!;
    const ret = new LinearBushing({
      name: `mirror_${this.name.value}`,
      fixedPoints: fp,
      toPoints: [toPoint0, ...toPoints],
      dlMin: this.dlMin.value,
      dlMax: this.dlMax.value,
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog
    });
    assignMeta(ret, {mirror: {to: this.nodeID}});
    return ret;
  }

  get inertialTensor(): NamedMatrix3 {
    return new NamedMatrix3({
      parent: this,
      name: 'inertialTensor'
    });
  }

  set inertialTensor(mat: NamedMatrix3) {
    // throw Error('Not Supported Exception');
  }

  fixedPointNames = ['support1', 'support2'];

  pointName = 'rodEnd';

  constructor(
    params:
      | {
          name: string;
          fixedPoints: [
            FunctionVector3 | IDataVector3 | INamedVector3,
            FunctionVector3 | IDataVector3 | INamedVector3
          ];
          toPoints: AtLeast1<number | string | IDataNumber | INamedNumber>;
          dlMin: number;
          dlMax: number;
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3 | IDataVector3 | INamedVector3;
        }
      | IDataLinearBushing
  ) {
    super(params);
    const {fixedPoints, toPoints, initialPosition, mass, centerOfGravity} =
      params;
    this.fixedPoints = [
      new NamedVector3({
        name: this.fixedPointNames[0],
        parent: this,
        value: fixedPoints[0]
      }),

      new NamedVector3({
        name: this.fixedPointNames[1],
        parent: this,
        value: fixedPoints[1]
      })
    ];
    const p = [...toPoints];
    const point0 = p.shift()!;
    this.toPoints = [
      new NamedNumber({
        name: `${this.pointName}1`,
        parent: this,
        value: point0
      }),
      ...p.map(
        (point, i) =>
          new NamedNumber({
            name: `${this.pointName}${i + 1}`,
            parent: this,
            value: point
          })
      )
    ];

    this.dlMin = new NamedNumber({
      name: 'dlMin',
      parent: this,
      value: params.dlMin
    });
    this.dlMax = new NamedNumber({
      name: 'dlMax',
      parent: this,
      value: params.dlMax
    });

    this.visible = new NamedBooleanOrUndefined({
      name: 'visible',
      parent: this,
      value: isDataElement(params) ? params.visible : true
    });
    this.initialPosition = new NamedVector3({
      name: 'initialPosition',
      parent: this,
      value: initialPosition ?? new Vector3()
    });
    this.mass = new NamedNumber({
      name: 'mass',
      parent: this,
      value: mass ?? 0.001
    });
    this.centerOfGravity = new NamedVector3({
      name: 'centerOfGravity',
      parent: this,
      value: centerOfGravity ?? new Vector3()
    });
    this.position = new NamedVector3({
      name: 'position',
      parent: this,
      value: isDataElement(params)
        ? params.position
        : this.initialPosition.value
    });
    this.rotation = new NamedQuaternion({
      name: 'rotation',
      parent: this,
      value: isDataElement(params) ? params.rotation : new Quaternion()
    });
  }

  getDataElement(state: GDState): IDataLinearBushing {
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const mir = this.getAnotherElement(mirror);
    const baseData = super.getDataElementBase(state, mir);

    if (mir && isLinearBushing(mir)) {
      return {
        ...baseData,
        fixedPoints: [
          this.fixedPoints[0]
            .setValue(mirrorVec(mir.fixedPoints[0]))
            .getData(state),
          this.fixedPoints[1]
            .setValue(mirrorVec(mir.fixedPoints[1]))
            .getData(state)
        ],
        toPoints: this.toPoints.map((to) => to.getData(state)),
        dlMin: this.dlMin.getData(state),
        dlMax: this.dlMax.getData(state)
      };
    }
    return {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => point.getData(state)),
      toPoints: this.toPoints.map((to) => to.getData(state)),
      dlMin: this.dlMin.getData(state),
      dlMax: this.dlMax.getData(state)
    };
  }
}

export function getDummyElement(): IAssembly {
  return new Assembly({
    name: 'temp',
    children: [],
    joints: []
  });
}

const isDataElement = (params: any): params is IDataElement => {
  try {
    return 'isDataElement' in params;
  } catch {
    return false;
  }
};

const mirrorVec = (
  vec: INamedVector3,
  inplace: boolean = false
): INamedVector3 => {
  const v = inplace ? vec : new NamedVector3({value: vec});
  v.meta.mirrorTo = vec.nodeID;
  v.meta.isFreeNode = vec.meta.isFreeNode;

  (v.y as NamedNumber).setValue(minus(v.y.getStringValue()));
  v.pointOffsetTools?.forEach((tool) => getMirrorPOT(tool));
  return v;
};

const mirrorMat = (
  mat: INamedMatrix3,
  inplace: boolean = false
): INamedMatrix3 => {
  const m = inplace ? mat : new NamedMatrix3({value: mat});
  m.value.elements[1] *= -1;
  m.value.elements[4] *= -1;
  m.value.elements[7] *= -1;
  return m;
};

const getMirrorPOT = (tool: IPointOffsetTool): void => {
  if (isDeltaXYZ(tool)) {
    tool.dy.setValue(minus(tool.dy.getStringValue()));
    return;
  }
  if (isDirectionLength(tool)) {
    tool.ny.setValue(minus(tool.ny.getStringValue()));
    return;
  }
  throw Error('Not Supported Exception');
};

const syncPointsMirror = (
  mirTo: NamedVector3[],
  mirFrom: INamedVector3[],
  state: GDState
): IDataVector3[] => {
  const listP = mirTo.reduce(
    (obj, x) =>
      Object.assign(obj, {
        [x.meta.mirrorTo ?? 'なぜかミラー設定されていない']: x
      }),
    {} as {[name: string]: INamedVector3}
  );
  return mirFrom.map((v) => {
    if (Object.keys(listP).includes(v.nodeID)) {
      const mirrorV = mirrorVec(v);
      const tmp = listP[v.nodeID].setValue(mirrorV);
      tmp.meta = {...mirrorV.meta};
      return tmp.getData(state);
    }
    return mirrorVec(v).getData(state);
  });
};
