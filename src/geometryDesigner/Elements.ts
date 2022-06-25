/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import {Vector3, Matrix3} from 'three';
import {NamedVector3, NamedMatrix3, NamedPrimitive} from '@gd/NamedValues';
import {AtLeast1, AtLeast2} from '@app/utils/atLeast';
import {v1 as uuidv1} from 'uuid';
import {
  Millimeter,
  Joint,
  ElementID,
  NodeID,
  NodeWithPath,
  IElement,
  IDataElement,
  IAssembly,
  IDataAssembly,
  isDataAssembly,
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
  isDataTire
} from './IElements';

export function getElement(element: IDataElement): IElement {
  if (isDataAssembly(element)) {
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

export function getAssembly(assembly: IDataAssembly): IAssembly {
  return getElement(assembly) as IAssembly;
}

const isDataElement = (params: any): params is IDataElement =>
  'absPath' in params;

export abstract class Element {
  _nodeID: string;

  name: NamedPrimitive<string>;

  parent: IAssembly | null = null;

  get absPath(): string {
    return `${this.nodeID}${this.parent ? `@${this.parent.absPath}` : ''}`;
  }

  get nodeID(): string {
    return this._nodeID;
  }

  constructor(params: {name: string} | IDataElement) {
    this._nodeID = uuidv1(); // ⇨ '2c5ea4c0-4067-11e9-8bad-9b1deb4d3b7d'

    const {name} = params;
    this.name = new NamedPrimitive({
      name: 'name',
      parent: this,
      value: name
    });
    if (isDataElement(params)) {
      const element = params;
      this._nodeID = element.nodeID;
    }
  }

  abstract get className(): string;

  abstract get visible(): NamedPrimitive<boolean | undefined>;

  // eslint-disable-next-line no-unused-vars
  abstract set visible(b: NamedPrimitive<boolean | undefined>);

  abstract get mass(): NamedPrimitive<number>;

  // eslint-disable-next-line no-unused-vars
  abstract set mass(m: NamedPrimitive<number>);

  abstract get position(): NamedVector3;

  // eslint-disable-next-line no-unused-vars
  abstract set position(p: NamedVector3);

  abstract get initialPosition(): NamedVector3;

  // eslint-disable-next-line no-unused-vars
  abstract set initialPosition(p: NamedVector3);

  abstract get centerOfGravity(): NamedVector3;

  // eslint-disable-next-line no-unused-vars
  abstract set centerOfGravity(v: NamedVector3);

  abstract get inertialTensor(): NamedMatrix3;

  // eslint-disable-next-line no-unused-vars
  abstract set inertialTensor(mat: NamedMatrix3);

  getDataElementBase(): IDataElement {
    return {
      className: this.className,
      name: this.name.getData(),
      inertialTensor: this.inertialTensor.getData(),
      centerOfGravity: this.centerOfGravity.getData(),
      mass: this.mass.getData(),
      nodeID: this.nodeID,
      absPath: this.absPath,

      position: this.position.getData(),
      initialPosition: this.initialPosition.getData(),
      visible: this.visible.getData()
    };
  }
}

export class Assembly extends Element implements IAssembly {
  get className(): string {
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

  get visible(): NamedPrimitive<boolean | undefined> {
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
    if (undef)
      return new NamedPrimitive<boolean | undefined>({
        name: 'visible',
        parent: this,
        value: undefined
      });
    if (allTrue)
      return new NamedPrimitive<boolean | undefined>({
        name: 'visible',
        parent: this,
        value: true
      });
    if (!allFalse)
      return new NamedPrimitive<boolean | undefined>({
        name: 'visible',
        parent: this,
        value: false
      });
    return new NamedPrimitive<boolean | undefined>({
      name: 'visible',
      parent: this,
      value: undefined
    });
  }

  set visible(visibility: NamedPrimitive<boolean | undefined>) {
    this.children.forEach((child) => {
      child.visible = visibility;
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

  getJointedNodeIDs(id: ElementID): NodeID[] {
    const joints = this.joints.filter(
      (joint) => joint.lhs[0] === id || joint.rhs[0] === id
    );
    const jointedPoints = joints.map((joint) =>
      joint.lhs[0] === id ? joint.lhs[1] : joint.rhs[1]
    );
    return jointedPoints;
  }

  getNodes(): NodeWithPath[] {
    // eslint-disable-next-line no-array-constructor
    let points = new Array<NodeWithPath>();
    this.children.forEach((element, elementID) => {
      let pis = element.getNodes();
      const jointedNodeIDs = this.getJointedNodeIDs(elementID);
      pis = pis.filter((_, i) => !jointedNodeIDs.includes(i));
      pis = pis.map((pi) => {
        return {p: pi.p, path: `${pi.path}@${this.nodeID}`};
      });
      points = [...points, ...pis];
    });
    return points;
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.children.forEach((child) => {
      child.arrange(this.initialPosition.clone().value.add(pp));
    });
  }

  getMirror(): Assembly {
    const children = this.children.map((child) => child.getMirror());
    const joints: Joint[] = this.joints.map((joint) => {
      return {
        lhs: [joint.lhs[0], joint.lhs[1]],
        rhs: [joint.rhs[0], joint.rhs[1]]
      };
    });
    const initialPosition = this.initialPosition.clone().value;
    initialPosition.y *= -1;

    return new Assembly({
      name: `mirror_${this.name}`,
      children,
      joints,
      initialPosition
    });
  }

  getJoints(): NodeWithPath[] {
    // eslint-disable-next-line no-array-constructor
    let points = new Array<NodeWithPath>();
    this.children.forEach((element, elementID) => {
      let pis = element.getNodes();
      const jointedNodeIDs = this.getJointedNodeIDs(elementID);
      pis = pis.filter((_, i) => jointedNodeIDs.includes(i));
      pis = pis.map((pi) => {
        return {p: pi.p, path: pi.path};
      });
      points = [...points, ...pis];
    });
    return points;
  }

  get mass(): NamedPrimitive<number> {
    let mass = 0;
    this.children.forEach((child) => {
      mass += child.mass.value;
    });
    return new NamedPrimitive<number>({
      name: 'mass',
      parent: this,
      value: mass
    });
  }

  // eslint-disable-next-line no-empty-function
  set mass(m: NamedPrimitive<number>) {}

  get centerOfGravity(): NamedVector3 {
    const center = new Vector3();
    this.children.forEach((child) => {
      center.add(child.position.clone().value.multiplyScalar(child.mass.value));
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
    return new NamedMatrix3({name: 'inertialTensor', parent: this});
  }

  // eslint-disable-next-line no-empty-function
  set inertialTensor(mat: NamedMatrix3) {}

  // eslint-disable-next-line no-empty-function
  get rotation(): NamedMatrix3 {
    return new NamedMatrix3({name: 'rotation', parent: this});
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

    const {joints, initialPosition} = params;

    this.joints = joints;
    this.initialPosition = new NamedVector3({
      name: 'initialPosition',
      parent: this,
      value: initialPosition
    });
    if (isDataElement(params)) {
      this._children = params.children.map((child) => getElement(child));
    } else {
      this._children = params.children;
    }

    this.children.forEach((child) => {
      child.parent = this;
    });
    this.arrange();
  }

  getDataElement(): IDataAssembly {
    const baseData = super.getDataElementBase();
    const data: IDataAssembly = {
      ...baseData,
      children: this.children.map((child) => child.getDataElement()),
      joints: [...this.joints]
    };
    return data;
  }
}

export class Frame extends Assembly {
  constructor(name: string, children: IElement[]) {
    const joints: Joint[] = [];
    super({name, children, joints});
  }
}

export class Bar extends Element implements IBar {
  get className(): string {
    return 'Bar';
  }

  visible: NamedPrimitive<boolean | undefined>;

  mass: NamedPrimitive<number>;

  centerOfGravity: NamedVector3;

  fixedPoint: NamedVector3;

  point: NamedVector3;

  initialPosition: NamedVector3;

  position: NamedVector3;

  rotation: NamedMatrix3;

  getNodes(): NodeWithPath[] {
    return [
      {p: this.fixedPoint.value, path: `fixedPoint@${this.nodeID}`},
      {p: this.point.value, path: `point@${this.nodeID}`}
    ];
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
      name: `mirror_${this.name}`,
      fixedPoint: fp,
      point: p,
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog
    });
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

    this.visible = new NamedPrimitive<boolean | undefined>({
      name: 'visible',
      parent: this,
      value: true
    });
    this.initialPosition = new NamedVector3({
      name: 'initialPosition',
      parent: this,
      value: initialPosition ?? new Vector3()
    });
    this.mass = new NamedPrimitive<number>({
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

  getDataElement(): IDataBar {
    const baseData = super.getDataElementBase();

    const data: IDataBar = {
      ...baseData,
      fixedPoint: this.fixedPoint.getData(),
      point: this.point.getData()
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

  dlMin: NamedPrimitive<Millimeter>;

  dlMax: NamedPrimitive<Millimeter>;

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
    this.dlMin = new NamedPrimitive<Millimeter>({
      name: 'dlMin',
      parent: this,
      value: params.dlMin
    });
    this.dlMax = new NamedPrimitive<Millimeter>({
      name: 'dlMax',
      parent: this,
      value: params.dlMax
    });
  }

  getDataElement(): IDataSpringDumper {
    const baseData = super.getDataElement();
    const data: IDataSpringDumper = {
      ...baseData,
      dlMin: this.dlMin.getData(),
      dlMax: this.dlMax.getData()
    };
    return data;
  }
}

export class AArm extends Element implements IAArm {
  get className(): string {
    return 'AArm';
  }

  visible: NamedPrimitive<boolean | undefined>;

  mass: NamedPrimitive<number>;

  centerOfGravity: NamedVector3;

  initialPosition: NamedVector3;

  position: NamedVector3;

  rotation: NamedMatrix3;

  fixedPoints: [NamedVector3, NamedVector3];

  points: AtLeast1<NamedVector3>;

  getNodes(): NodeWithPath[] {
    const fp = this.fixedPoints.map((point, i): NodeWithPath => {
      return {p: point.value, path: `fixedPoint:${i}@${this.nodeID}`};
    });
    const p = this.points.map((point, i): NodeWithPath => {
      return {p: point.value, path: `point:${i}@${this.nodeID}`};
    });

    return [...fp, ...p];
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
      name: `mirror_${this.name}`,
      fixedPoints: fp,
      points: [point0, ...points],
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: this.centerOfGravity.value
    });
  }

  get inertialTensor(): NamedMatrix3 {
    return new NamedMatrix3({name: 'inertialTensor', parent: this});
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
    const point0 = points.pop()!;
    this.points = [
      new NamedVector3({
        name: this.pointNames[0],
        parent: this,
        value: point0
      }),
      ...points.map(
        (point, i) =>
          new NamedVector3({
            name: `${this.pointNames[1]}${i + 1}`,
            parent: this,
            value: point
          })
      )
    ];

    this.visible = new NamedPrimitive<boolean | undefined>({
      name: 'visible',
      parent: this,
      value: true
    });
    this.initialPosition = new NamedVector3({
      name: 'initialPosition',
      parent: this,
      value: initialPosition ?? new Vector3()
    });
    this.mass = new NamedPrimitive<number>({
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

  getDataElement(): IDataAArm {
    const baseData = super.getDataElementBase();
    const data: IDataAArm = {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => point.getData()),
      points: this.points.map((point) => point.getData())
    };
    return data;
  }
}

export class BellCrank extends Element implements IBellCrank {
  get className(): string {
    return 'BellCrank';
  }

  visible: NamedPrimitive<boolean | undefined>;

  mass: NamedPrimitive<number>;

  centerOfGravity: NamedVector3;

  fixedPoints: [NamedVector3, NamedVector3];

  points: AtLeast2<NamedVector3>;

  initialPosition: NamedVector3;

  position: NamedVector3;

  rotation: NamedMatrix3;

  getNodes(): NodeWithPath[] {
    const fp = this.fixedPoints.map((point, i): NodeWithPath => {
      return {p: point.value, path: `fixedPoint:${i}@${this.nodeID}`};
    });
    const p = this.points.map((point, i): NodeWithPath => {
      return {p: point.value, path: `point:${i}@${this.nodeID}`};
    });

    return [...fp, ...p];
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
      name: `mirror_${this.name}`,
      fixedPoints: fp,
      points: [point0, point1, ...points],
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog
    });
  }

  get inertialTensor(): NamedMatrix3 {
    return new NamedMatrix3({name: 'inertialTensor', parent: this});
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
    const point0 = points.pop()!;
    const point1 = points.pop()!;
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
      ...points.map(
        (point, i) =>
          new NamedVector3({
            name: `${this.pointNames[2]}${i + 1}`,
            parent: this,
            value: point
          })
      )
    ];

    this.visible = new NamedPrimitive<boolean | undefined>({
      name: 'visible',
      parent: this,
      value: true
    });
    this.initialPosition = new NamedVector3({
      name: 'initialPosition',
      parent: this,
      value: initialPosition ?? new Vector3()
    });
    this.mass = new NamedPrimitive<number>({
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

  getDataElement(): IDataBellCrank {
    const baseData = super.getDataElementBase();

    const data: IDataBellCrank = {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => point.getData()),
      points: this.points.map((point) => point.getData())
    };
    return data;
  }
}

export class Body extends Element implements IBody {
  get className(): string {
    return 'Body';
  }

  visible: NamedPrimitive<boolean | undefined>;

  mass: NamedPrimitive<number>;

  centerOfGravity: NamedVector3;

  fixedPoints: Array<NamedVector3>;

  points: Array<NamedVector3>;

  initialPosition: NamedVector3;

  position: NamedVector3;

  rotation: NamedMatrix3;

  getNodes(): NodeWithPath[] {
    const fp = this.fixedPoints.map((point, i): NodeWithPath => {
      return {p: point.value, path: `fixedPoint:${i}@${this.nodeID}`};
    });
    const p = this.points.map((point, i): NodeWithPath => {
      return {p: point.value, path: `point:${i}@${this.nodeID}`};
    });

    return [...fp, ...p];
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
      name: `mirror_${this.name}`,
      fixedPoints: fp,
      points,
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog
    });
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

    this.visible = new NamedPrimitive<boolean | undefined>({
      name: 'visible',
      parent: this,
      value: true
    });
    this.initialPosition = new NamedVector3({
      name: 'initialPosition',
      parent: this,
      value: initialPosition ?? new Vector3()
    });
    this.mass = new NamedPrimitive<number>({
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

  getDataElement(): IDataBody {
    const baseData = super.getDataElementBase();

    const data: IDataBody = {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => point.getData()),
      points: this.points.map((point) => point.getData())
    };
    return data;
  }
}

export class Tire extends Element implements ITire {
  get className(): string {
    return 'Tire';
  }

  visible: NamedPrimitive<boolean | undefined>;

  mass: NamedPrimitive<number>;

  centerOfGravity: NamedVector3;

  tireCenter: NamedVector3;

  toLeftBearing: NamedPrimitive<number>;

  toRightBearing: NamedPrimitive<number>;

  initialPosition: NamedVector3;

  position: NamedVector3;

  rotation: NamedMatrix3;

  get leftBearing(): Vector3 {
    return this.tireCenter.value
      .clone()
      .add(new Vector3(0, this.toLeftBearing.value, 0));
  }

  get rightBearing(): Vector3 {
    return this.tireCenter.value
      .clone()
      .add(new Vector3(0, this.toRightBearing.value, 0));
  }

  get ground(): Vector3 {
    return this.tireCenter.value
      .clone()
      .add(new Vector3(0, -this.tireCenter.value.y, 0));
  }

  getNodes(): NodeWithPath[] {
    return [
      {p: this.leftBearing, path: `leftBearing@${this.nodeID}`},
      {p: this.rightBearing, path: `rightBearing@${this.nodeID}`}
    ];
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
      name: `mirror_${this.name}`,
      tireCenter: center,
      toLeftBearing: -this.toRightBearing,
      toRightBearing: -this.toLeftBearing,
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

    this.tireCenter = new NamedVector3({
      name: 'tireCenter',
      parent: this,
      value: tireCenter ?? new Vector3()
    });
    this.toLeftBearing = new NamedPrimitive<number>({
      name: 'toLeftBearing',
      parent: this,
      value: toLeftBearing
    });
    this.toRightBearing = new NamedPrimitive<number>({
      name: 'toRightBearing',
      parent: this,
      value: toRightBearing
    });

    this.visible = new NamedPrimitive<boolean | undefined>({
      name: 'visible',
      parent: this,
      value: true
    });
    this.initialPosition = new NamedVector3({
      name: 'initialPosition',
      parent: this,
      value: initialPosition ?? new Vector3()
    });
    this.mass = new NamedPrimitive<number>({
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

  getDataElement(): IDataTire {
    const baseData = super.getDataElementBase();

    const data: IDataTire = {
      ...baseData,
      tireCenter: this.tireCenter.getData(),
      toLeftBearing: this.toLeftBearing.getData(),
      toRightBearing: this.toRightBearing.getData()
    };
    return data;
  }
}
