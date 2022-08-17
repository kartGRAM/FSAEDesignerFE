/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import {Vector3, Matrix3} from 'three';
import {
  NamedVector3,
  NamedMatrix3,
  NamedString,
  NamedNumber,
  NamedBooleanOrUndefined
} from '@gd/NamedValues';
import {INamedVector3} from '@gd/INamedValues';
import {AtLeast1, AtLeast2} from '@app/utils/atLeast';
import {v4 as uuidv4} from 'uuid';
import {GDState} from '@store/reducers/dataGeometryDesigner';
import {getRootNode} from './INode';
import {
  Millimeter,
  Joint,
  NodeID,
  IElement,
  isElement,
  isBody,
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
  ITire,
  IDataTire,
  isDataTire,
  Meta,
  assignMeta
} from './IElements';

export const trans = (p: INamedVector3): Vector3 => {
  const {parent} = p;
  if (isElement(parent)) {
    return parent.position.value
      .clone()
      .add(p.value.clone().applyMatrix3(parent.rotation.value));
  }
  return p.value;
};

export function getAssembly(assembly: IDataAssembly): IAssembly {
  return getElement(assembly) as IAssembly;
}

function getElement(element: IDataElement): IElement {
  if (isDataAssembly(element)) {
    if (isDataFrame(element)) {
      return new Frame(element);
    }
    return new Assembly(element);
  }
  if (isDataBar(element)) {
    return new Bar(element);
  }
  if (isDataSpringDumper(element)) {
    return new SpringDumper(element);
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
  throw Error('Not Supported Exception');
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
    }
  }

  abstract getPoints(): INamedVector3[];

  abstract getMirror(): IElement;

  abstract getDataElement(state: GDState): IDataElement;

  abstract arrange(parentPosition?: Vector3 | undefined): void;

  abstract get rotation(): NamedMatrix3;

  abstract set rotation(mat: NamedMatrix3);

  abstract get className(): string;

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

  getDataElementBase(state: GDState): IDataElement {
    return {
      isDataElement: true,
      className: this.className,
      name: this.name.getData(state),
      inertialTensor: this.inertialTensor.getData(),
      centerOfGravity: this.centerOfGravity.getData(state),
      mass: this.mass.getData(state),
      nodeID: this.nodeID,
      absPath: this.absPath,

      position: this.position.getData(state),
      initialPosition: this.initialPosition.getData(state),
      visible: this.visible.getData()
    };
  }
}

export class Assembly extends Element implements IAssembly {
  isAssembly = true as const;

  get className(): string {
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

  getJointsRecursive(): Joint[] {
    let joints: Joint[] = [...this.joints];
    this.children.forEach((child) => {
      if (isAssembly(child)) {
        joints = [...joints, ...child.getJointsRecursive()];
      }
    });
    return joints;
  }

  private getJointedNodeIDs(): NodeID[] {
    return this.joints.reduce((prev, current): NodeID[] => {
      prev.push(current.lhs.nodeID, current.rhs.nodeID);
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
    const children = this.children.map((child) => child.getMirror());
    let mirPoints: INamedVector3[] = [];
    children.forEach((child) => {
      mirPoints = [...mirPoints, ...child.getPoints()];
    });
    const points = this.getAllPointsOfChildren();

    const joints: Joint[] = this.joints.map((joint) => {
      return {
        lhs: mirPoints[points.findIndex((p) => p.nodeID === joint.lhs.nodeID)],
        rhs: mirPoints[points.findIndex((p) => p.nodeID === joint.rhs.nodeID)]
      };
    });
    const initialPosition = this.initialPosition.value.clone();
    initialPosition.y *= -1;

    return new Assembly({
      name: `mirror_${this.name.value}`,
      children,
      joints,
      initialPosition
    });
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
  get rotation(): NamedMatrix3 {
    return new NamedMatrix3({
      parent: this,
      name: 'rotation'
    });
  }

  // eslint-disable-next-line no-empty-function
  set rotation(mat: NamedMatrix3) {}

  constructor(
    params:
      | {
          name: string;
          children: IElement[];
          joints: Joint[];
          initialPosition?: Vector3;
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
      const allPoints = this.getAllPointsOfChildren();
      this.joints = params.joints
        .filter((joint) => {
          const lhs = allPoints.find((p) => p.nodeID === joint.lhs);
          const rhs = allPoints.find((p) => p.nodeID === joint.rhs);
          return lhs && rhs;
        })
        .map((joint) => {
          return {
            lhs: allPoints.find((p) => p.nodeID === joint.lhs) as INamedVector3,
            rhs: allPoints.find((p) => p.nodeID === joint.rhs) as INamedVector3
          };
        });
    } else {
      this._children = params.children;
      this._children.forEach((child) => {
        child.parent = this;
      });
      this.joints = params.joints;
    }

    this.arrange();
  }

  getDataElement(state: GDState): IDataAssembly {
    const baseData = super.getDataElementBase(state);
    const data: IDataAssembly = {
      ...baseData,
      isDataAssembly: true,
      children: this.children.map((child) => child.getDataElement(state)),
      joints: this.joints.map((joint) => {
        return {lhs: joint.lhs.nodeID, rhs: joint.rhs.nodeID};
      })
    };
    return data;
  }
}

export class Frame extends Assembly {
  get className(): string {
    return 'Frame' as const;
  }

  readonly frameBody: IBody;

  constructor(
    params:
      | {
          name: string;
          children: IElement[];
          initialPosition?: Vector3;
          mass?: number;
          centerOfGravity?: Vector3;
        }
      | IDataFrame
  ) {
    if (!isDataElement(params)) {
      const {name, children, initialPosition, mass, centerOfGravity} = params;
      const namedPoints = children.reduce((prev: INamedVector3[], child) => {
        prev = [...prev, ...child.getPoints()];
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
        lhs: p,
        rhs: body.fixedPoints[i]
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
            prev = [...prev, ...child.getPoints()];
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
          lhs: p,
          rhs: body.fixedPoints[i]
        }));
      } else {
        throw new Error('FrameのChildrenにBodyデータがない');
      }
    }
  }

  getDataElement(state: GDState): IDataFrame {
    const data = super.getDataElement(state);
    return {...data, bodyID: this.frameBody.nodeID};
  }
}

export class Bar extends Element implements IBar {
  get className(): string {
    return 'Bar';
  }

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  fixedPoint: NamedVector3;

  point: NamedVector3;

  initialPosition: NamedVector3;

  position: NamedVector3;

  rotation: NamedMatrix3;

  getPoints(): INamedVector3[] {
    return [this.fixedPoint, this.point];
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
  }

  getMirror(): Bar {
    const fp = this.fixedPoint.value.clone();
    fp.setY(-fp.y);
    const p = this.point.value.clone();
    p.setY(-p.y);
    const ip = this.initialPosition.value.clone();
    ip.setY(-ip.y);
    const cog = this.centerOfGravity.value.clone();
    cog.setY(-cog.y);
    return new Bar({
      name: `mirror_${this.name.value}`,
      fixedPoint: fp,
      point: p,
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog
    });
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
          fixedPoint: Vector3;
          point: Vector3;
          initialPosition?: Vector3;
          mass?: number;
          centerOfGravity?: Vector3;
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
    this.rotation = new NamedMatrix3({
      name: 'rotation',
      parent: this,
      value: isDataElement(params) ? params.rotation : new Matrix3()
    });
  }

  getDataElement(state: GDState): IDataBar {
    const baseData = super.getDataElementBase(state);

    const data: IDataBar = {
      ...baseData,
      fixedPoint: this.fixedPoint.getData(state),
      point: this.point.getData(state)
    };
    return data;
  }
}

export class SpringDumper extends Bar implements ISpringDumper {
  get className(): string {
    return 'SpringDumper';
  }

  getMirror(): SpringDumper {
    const fp = this.fixedPoint.value.clone();
    fp.setY(-fp.y);
    const p = this.point.value.clone();
    p.setY(-p.y);
    const ip = this.initialPosition.value.clone();
    ip.setY(-ip.y);
    const cog = this.centerOfGravity.value.clone();
    cog.setY(-cog.y);
    return new SpringDumper({
      name: `mirror_${this.name}`,
      fixedPoint: fp,
      point: p,
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog,
      dlMin: this.dlMin.value,
      dlMax: this.dlMax.value
    });
  }

  dlMin: NamedNumber;

  dlMax: NamedNumber;

  constructor(
    params:
      | {
          name: string;
          fixedPoint: Vector3;
          point: Vector3;
          dlMin: Millimeter;
          dlMax: Millimeter;
          initialPosition?: Vector3;
          mass?: number;
          centerOfGravity?: Vector3;
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
  get className(): string {
    return 'AArm';
  }

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  initialPosition: NamedVector3;

  position: NamedVector3;

  rotation: NamedMatrix3;

  fixedPoints: [NamedVector3, NamedVector3];

  points: AtLeast1<NamedVector3>;

  getPoints(): INamedVector3[] {
    return [...this.fixedPoints, ...this.points];
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
  }

  getMirror(): AArm {
    const fp: [Vector3, Vector3] = [
      this.fixedPoints[0].value.clone(),
      this.fixedPoints[1].value.clone()
    ];
    fp[0].setY(-fp[0].y);
    fp[1].setY(-fp[1].y);
    const points = this.points.map((point) => {
      const p = point.value.clone();
      p.setY(-p.y);
      return p;
    });
    const ip = this.initialPosition.value.clone();
    ip.setY(-ip.y);
    const cog = this.centerOfGravity.value.clone();
    cog.setY(-cog.y);
    const point0 = points.shift()!;
    return new AArm({
      name: `mirror_${this.name.value}`,
      fixedPoints: fp,
      points: [point0, ...points],
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: this.centerOfGravity.value
    });
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
          fixedPoints: [Vector3, Vector3];
          points: AtLeast1<Vector3>;
          initialPosition?: Vector3;
          mass?: number;
          centerOfGravity?: Vector3;
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
    this.rotation = new NamedMatrix3({
      name: 'rotation',
      parent: this,
      value: isDataElement(params) ? params.rotation : new Matrix3()
    });
  }

  getDataElement(state: GDState): IDataAArm {
    const baseData = super.getDataElementBase(state);
    const data: IDataAArm = {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => point.getData(state)),
      points: this.points.map((point) => point.getData(state))
    };
    return data;
  }
}

export class BellCrank extends Element implements IBellCrank {
  get className(): string {
    return 'BellCrank';
  }

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  fixedPoints: [NamedVector3, NamedVector3];

  points: AtLeast2<NamedVector3>;

  initialPosition: NamedVector3;

  position: NamedVector3;

  rotation: NamedMatrix3;

  getPoints(): INamedVector3[] {
    return [...this.fixedPoints, ...this.points];
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
  }

  getMirror(): BellCrank {
    const fp: [Vector3, Vector3] = [
      this.fixedPoints[0].value.clone(),
      this.fixedPoints[1].value.clone()
    ];
    fp[0].setY(-fp[0].y);
    fp[1].setY(-fp[1].y);
    const points = this.points.map((point) => {
      const p = point.value.clone();
      p.setY(-p.y);
      return p;
    });
    const point0 = points.shift()!;
    const point1 = points.shift()!;
    const ip = this.initialPosition.value.clone();
    ip.setY(-ip.y);
    const cog = this.centerOfGravity.value.clone();
    cog.setY(-cog.y);
    return new BellCrank({
      name: `mirror_${this.name.value}`,
      fixedPoints: fp,
      points: [point0, point1, ...points],
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog
    });
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
          fixedPoints: [Vector3, Vector3];
          points: AtLeast2<Vector3>;
          initialPosition?: Vector3;
          mass?: number;
          centerOfGravity?: Vector3;
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
    this.rotation = new NamedMatrix3({
      name: 'rotation',
      parent: this,
      value: isDataElement(params) ? params.rotation : new Matrix3()
    });
  }

  getDataElement(state: GDState): IDataBellCrank {
    const baseData = super.getDataElementBase(state);

    const data: IDataBellCrank = {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => point.getData(state)),
      points: this.points.map((point) => point.getData(state))
    };
    return data;
  }
}

export class Body extends Element implements IBody {
  get className(): string {
    return 'Body';
  }

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  fixedPoints: Array<NamedVector3>;

  points: Array<NamedVector3>;

  initialPosition: NamedVector3;

  position: NamedVector3;

  rotation: NamedMatrix3;

  getPoints(): INamedVector3[] {
    return [...this.fixedPoints, ...this.points];
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
  }

  getMirror(): Body {
    const fp = this.fixedPoints.map((point) => {
      const p = point.value.clone();
      p.setY(-p.y);
      return p;
    });
    const points = this.points.map((point) => {
      const p = point.value.clone();
      p.setY(-p.y);
      return p;
    });
    const ip = this.initialPosition.value.clone();
    ip.setY(-ip.y);
    const cog = this.centerOfGravity.value.clone();
    cog.setY(-cog.y);
    return new Body({
      name: `mirror_${this.name.value}`,
      fixedPoints: fp,
      points,
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog
    });
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
          fixedPoints: Array<Vector3>;
          points: Array<Vector3>;
          initialPosition?: Vector3;
          mass?: number;
          centerOfGravity?: Vector3;
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
    this.rotation = new NamedMatrix3({
      name: 'rotation',
      parent: this,
      value: isDataElement(params) ? params.rotation : new Matrix3()
    });
  }

  getDataElement(state: GDState): IDataBody {
    const baseData = super.getDataElementBase(state);

    const data: IDataBody = {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => point.getData(state)),
      points: this.points.map((point) => point.getData(state))
    };
    return data;
  }
}

export class Tire extends Element implements ITire {
  get className(): string {
    return 'Tire';
  }

  leftBearingNodeID: string;

  rightBearingNodeID: string;

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  tireCenter: NamedVector3;

  toLeftBearing: NamedNumber;

  toRightBearing: NamedNumber;

  initialPosition: NamedVector3;

  position: NamedVector3;

  rotation: NamedMatrix3;

  /* 直す必要あり */
  get leftBearing(): NamedVector3 {
    return new NamedVector3({
      name: 'leftBaring',
      parent: this,
      value: this.tireCenter.value
        .clone()
        .add(new Vector3(0, this.toLeftBearing.value, 0)),
      update: () => {},
      nodeID: this.leftBearingNodeID
    });
  }

  /* 直す必要あり */
  get rightBearing(): NamedVector3 {
    return new NamedVector3({
      name: 'rightBaring',
      parent: this,
      value: this.tireCenter.value
        .clone()
        .add(new Vector3(0, this.toRightBearing.value, 0)),
      update: () => {},
      nodeID: this.rightBearingNodeID
    });
  }

  get ground(): Vector3 {
    return this.tireCenter.value
      .clone()
      .add(new Vector3(0, -this.tireCenter.value.y, 0));
  }

  getPoints(): INamedVector3[] {
    return [this.leftBearing, this.rightBearing];
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
  }

  getMirror(): Tire {
    const center = this.tireCenter.value.clone();
    center.setY(-center.y);
    const ip = this.initialPosition.value.clone();
    ip.setY(-ip.y);
    const cog = this.centerOfGravity.value.clone();
    cog.setY(-cog.y);
    return new Tire({
      name: `mirror_${this.name.value}`,
      tireCenter: center,
      toLeftBearing: -this.toRightBearing.value,
      toRightBearing: -this.toLeftBearing.value,
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog
    });
  }

  get diameter(): Millimeter {
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
          tireCenter: Vector3;
          toLeftBearing: number;
          toRightBearing: number;
          initialPosition?: Vector3;
          mass?: number;
          centerOfGravity?: Vector3;
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
    if (isDataElement(params)) {
      this.leftBearingNodeID = params.leftBearingNodeID;
      this.rightBearingNodeID = params.rightBearingNodeID;
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
    this.rotation = new NamedMatrix3({
      name: 'rotation',
      parent: this,
      value: isDataElement(params) ? params.rotation : new Matrix3()
    });
  }

  getDataElement(state: GDState): IDataTire {
    const baseData = super.getDataElementBase(state);

    const data: IDataTire = {
      ...baseData,
      tireCenter: this.tireCenter.getData(state),
      toLeftBearing: this.toLeftBearing.getData(state),
      toRightBearing: this.toRightBearing.getData(state),
      leftBearingNodeID: this.leftBearingNodeID,
      rightBearingNodeID: this.rightBearingNodeID
    };
    return data;
  }
}
