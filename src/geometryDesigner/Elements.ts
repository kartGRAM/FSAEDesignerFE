/* eslint-disable @typescript-eslint/no-unused-vars */
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
import {AtLeast1, AtLeast2} from '@app/utils/atLeast';
import {v1 as uuidv1} from 'uuid';
import {GDState} from '@store/reducers/dataGeometryDesigner';
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
  isAssembly,
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

export function getAssembly(assembly: IDataAssembly): IAssembly {
  return getElement(assembly) as IAssembly;
}

function getElement(element: IDataElement): IElement {
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

const isDataElement = (params: any): params is IDataElement =>
  'absPath' in params;

export abstract class Element implements IElement {
  _nodeID: string;

  name: NamedString;

  parent: IAssembly | null = null;

  get absPath(): string {
    return `${this.nodeID}${this.parent ? `@${this.parent.absPath}` : ''}`;
  }

  get nodeID(): string {
    return this._nodeID;
  }

  getRoot(): IAssembly | null {
    let assembly: IAssembly | null = this.parent;
    if (assembly) {
      while (assembly.parent !== null) {
        assembly = assembly.parent;
      }
    } else if (isAssembly(this)) return this;
    return assembly;
  }

  constructor(params: {name: string} | IDataElement) {
    this._nodeID = uuidv1(); // ⇨ '2c5ea4c0-4067-11e9-8bad-9b1deb4d3b7d'

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

  abstract getNodes(): NodeWithPath[];

  abstract getMirror(): IElement;

  abstract getDataElement(state: GDState): IDataElement;

  abstract arrange(parentPosition?: Vector3 | undefined): void;

  abstract get rotation(): NamedMatrix3;

  abstract set rotation(mat: NamedMatrix3);

  /* _values: {[index: string]: INamedValue} = {};

  registerNamedValue<T extends INamedValue>(value: T, override = false): void {
    if (!override && value.name in this._values)
      throw new Error('Elementの変数名が被っている');
    this._values[value.name] = value;
  } */

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
      child.arrange(this.initialPosition.value.clone().add(pp));
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
    const initialPosition = this.initialPosition.value.clone();
    initialPosition.y *= -1;

    return new Assembly({
      name: `mirror_${this.name.value}`,
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

  getDataElement(state: GDState): IDataAssembly {
    const baseData = super.getDataElementBase(state);
    const data: IDataAssembly = {
      ...baseData,
      children: this.children.map((child) => child.getDataElement(state)),
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

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

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

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  tireCenter: NamedVector3;

  toLeftBearing: NamedNumber;

  toRightBearing: NamedNumber;

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
      toRightBearing: this.toRightBearing.getData(state)
    };
    return data;
  }
}
