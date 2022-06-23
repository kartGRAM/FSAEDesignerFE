/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import {Vector3, Matrix3} from 'three';
import {
  NamedVector3,
  NamedMatrix3,
  NamedPrimitive,
  INamedValue
} from '@gd/NamedValues';
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
    const children = element.children.map((child) => getElement(child));
    const assembly = new Assembly('', [], [], undefined);
    assembly.setDataElement(element, children);
    return assembly;
  }
  if (isDataBar(element)) {
    const bar = new Bar('', new Vector3(), new Vector3(), undefined);
    bar.setDataElement(element);
    return bar;
  }
  if (isDataSpringDumper(element)) {
    const sd = new SpringDumper(
      '',
      new Vector3(),
      new Vector3(),
      0,
      0,
      undefined
    );
    sd.setDataElement(element);
    return sd;
  }
  if (isDataAArm(element)) {
    const aarm = new AArm(
      '',
      [new Vector3(), new Vector3()],
      [new Vector3()],
      undefined
    );
    aarm.setDataElement(element);
    return aarm;
  }
  if (isDataBellCrank(element)) {
    const bc = new BellCrank(
      '',
      [new Vector3(), new Vector3()],
      [new Vector3(), new Vector3()],
      undefined
    );
    bc.setDataElement(element);
    return bc;
  }
  if (isDataBody(element)) {
    const body = new Body('', [], [], undefined);
    body.setDataElement(element);
    return body;
  }
  if (isDataTire(element)) {
    const tire = new Tire('', new Vector3(), 0, 0, undefined);
    tire.setDataElement(element);
    return tire;
  }
  throw Error('Not Supported Exception');
}

export function getAssembly(assembly: IDataAssembly): IAssembly {
  return getElement(assembly) as IAssembly;
}

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

  protected isData = (params: any): params is IDataElement =>
    'absPath' in params;

  constructor(params: {name: string} | IDataElement) {
    this._nodeID = uuidv1(); // ⇨ '2c5ea4c0-4067-11e9-8bad-9b1deb4d3b7d'

    this.name = new NamedPrimitive({
      name: 'name',
      parent: this,
      value: ''
    });
    if (this.isData(params)) {
      const element = params;
      this._nodeID = element.nodeID;
      this.name.value = element.name;
    } else {
      const {name} = params;
      this.name.value = name;
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setData(value: INamedValue): void {}
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

  set centerOfGravity(v: NamedVector3) {}

  get inertialTensor(): NamedMatrix3 {
    return new NamedMatrix3({name: 'inertialTensor', parent: this});
  }

  // eslint-disable-next-line no-empty-function
  set inertialTensor(mat: NamedMatrix3) {}

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
      data: initialPosition
    });
    if (this.isData(params)) {
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
    this.position = this.position.clone(
      this.initialPosition.value.clone().add(pp)
    );
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
      data: fixedPoint
    });
    this.point = new NamedVector3({
      name: 'point',
      parent: this,
      data: point
    });

    this.visible = new NamedPrimitive<boolean | undefined>({
      name: 'visible',
      parent: this,
      value: true
    });
    this.initialPosition = new NamedVector3({
      name: 'initialPosition',
      parent: this,
      data: initialPosition ?? new Vector3()
    });
    this.mass = new NamedPrimitive<number>({
      name: 'mass',
      parent: this,
      value: mass ?? 0.001
    });
    this.centerOfGravity = new NamedVector3({
      name: 'centerOfGravity',
      parent: this,
      data: centerOfGravity ?? new Vector3()
    });
    this.position = new NamedVector3({
      name: 'position',
      parent: this,
      value: this.initialPosition.value
    });
    this.rotation = new NamedMatrix3({name: 'rotation', parent: this});
    if (this.isData(params)) {
      this.position = this.position.clone(params.position);
      this.rotation = this.rotation.clone(params.rotation);
    }
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
      dlMin: this.dlMin.value,
      dlMax: this.dlMax.value
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
    this.position = this.position.clone(
      this.initialPosition.value.clone().add(pp)
    );
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
    return new AArm(
      `mirror_${this.name}`,
      fp,
      [point0, ...points],
      ip,
      this.mass.value,
      this.centerOfGravity.value
    );
  }

  get inertialTensor(): NamedMatrix3 {
    return new NamedMatrix3({name: 'inertialTensor', parent: this});
  }

  set inertialTensor(mat: NamedMatrix3) {
    // throw Error('Not Supported Exception');
  }

  fixedPointName = ['chassisFore', 'chassisAft'];

  pointName = ['upright', 'attachedPoint'];

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
    this.fixedPoints = fixedPoints;
    this.points = points;

    const {initialPosition, mass, centerOfGravity} = params;
    this.visible = new NamedPrimitive<boolean | undefined>({
      name: 'visible',
      parent: this,
      value: true
    });
    this.initialPosition = new NamedVector3({
      name: 'initialPosition',
      parent: this,
      data: initialPosition ?? new Vector3()
    });
    this.mass = new NamedPrimitive<number>({
      name: 'mass',
      parent: this,
      value: mass ?? 0.001
    });
    this.centerOfGravity = new NamedVector3({
      name: 'centerOfGravity',
      parent: this,
      data: centerOfGravity ?? new Vector3()
    });
    this.position = new NamedVector3({
      name: 'position',
      parent: this,
      value: this.initialPosition.value
    });
    this.rotation = new NamedMatrix3({name: 'rotation', parent: this});
    if (this.isData(params)) {
      this.position = this.position.clone(params.position);
      this.rotation = this.rotation.clone(params.rotation);
    }
  }

  getDataElement(): IDataAArm {
    const baseData = super.getDataElementBase();
    const gd3 = getDataVector3;

    const data: IDataAArm = {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point, i) =>
        gd3(point, this.fixedPointName[i], this.absPath)
      ),
      points: this.points.map((point, i) =>
        gd3(
          point,
          i < 1 ? this.pointName[i] : `${this.pointName[1]}${i - 1}`,
          this.absPath
        )
      )
    };
    return data;
  }
}

export class BellCrank extends Element implements IBellCrank {
  get className(): string {
    return 'BellCrank';
  }

  visible: boolean | undefined = true;

  mass: number;

  centerOfGravity: Vector3;

  fixedPoints: [Vector3, Vector3];

  points: AtLeast2<Vector3>;

  initialPosition: Vector3;

  position: Vector3;

  rotation: Matrix3 = new Matrix3();

  getNodes(): NodeWithPath[] {
    const fp = this.fixedPoints.map((point, i): NodeWithPath => {
      return {p: point, path: `fixedPoint:${i}@${this.nodeID}`};
    });
    const p = this.points.map((point, i): NodeWithPath => {
      return {p: point, path: `point:${i}@${this.nodeID}`};
    });

    return [...fp, ...p];
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position = this.initialPosition.clone().add(pp);
  }

  getMirror(): BellCrank {
    const fp: [Vector3, Vector3] = [
      this.fixedPoints[0].clone(),
      this.fixedPoints[1].clone()
    ];
    fp[0].setY(-fp[0].y);
    fp[1].setY(-fp[1].y);
    const points = this.points.map((point) => {
      const p = point.clone();
      p.setY(-p.y);
      return p;
    });
    const point0 = points.shift()!;
    const point1 = points.shift()!;
    const ip = this.initialPosition.clone();
    ip.setY(-ip.y);
    const cog = this.centerOfGravity.clone();
    cog.setY(-cog.y);
    return new BellCrank(
      `mirror_${this.name}`,
      fp,
      [point0, point1, ...points],
      ip,
      this.mass,
      cog
    );
  }

  get inertialTensor(): Matrix3 {
    return new Matrix3();
  }

  set inertialTensor(mat: Matrix3) {
    // throw Error('Not Supported Exception');
  }

  constructor(
    name: string,
    fixedPoints: [Vector3, Vector3],
    points: AtLeast2<Vector3>,
    initialPosition?: Vector3,
    mass?: number,
    centerOfGravity?: Vector3
  ) {
    super(name);
    this.fixedPoints = fixedPoints;
    this.points = points;
    this.initialPosition = initialPosition ?? new Vector3();
    this.position = this.initialPosition;
    this.mass = mass ?? 0.001;
    this.centerOfGravity = centerOfGravity ?? new Vector3();
  }

  fixedPointName = ['pivot1', 'pivot2'];

  pointName = ['coilover', 'rod', 'attachment'];

  getDataElement(): IDataBellCrank {
    const baseData = super.getDataElementBase();
    const gd3 = getDataVector3;

    const data: IDataBellCrank = {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point, i) =>
        gd3(point, this.fixedPointName[i], this.absPath)
      ),
      points: this.points.map((point, i) =>
        gd3(
          point,
          i < 2 ? this.pointName[i] : `${this.pointName[2]}${i - 2}`,
          this.absPath
        )
      )
    };
    return data;
  }

  setDataElement(element: IDataBellCrank) {
    super.setDataElementBase(element);
    const fp = element.fixedPoints.map((v) => getVector3(v).v);
    this.fixedPoints = [fp[0], fp[1]];
    const p = element.points.map((v) => getVector3(v).v);
    const point0 = p.shift()!;
    const point1 = p.shift()!;
    this.points = [point0, point1, ...p];
  }
}

export class Body extends Element implements IBody {
  get className(): string {
    return 'Body';
  }

  visible: boolean | undefined = true;

  mass: number;

  centerOfGravity: Vector3;

  fixedPoints: Array<Vector3>;

  points: Array<Vector3>;

  initialPosition: Vector3;

  position: Vector3;

  rotation: Matrix3 = new Matrix3();

  getNodes(): NodeWithPath[] {
    const fp = this.fixedPoints.map((point, i): NodeWithPath => {
      return {p: point, path: `fixedPoint:${i}@${this.nodeID}`};
    });
    const p = this.points.map((point, i): NodeWithPath => {
      return {p: point, path: `point:${i}@${this.nodeID}`};
    });

    return [...fp, ...p];
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position = this.initialPosition.clone().add(pp);
  }

  getMirror(): Body {
    const fp = this.fixedPoints.map((point) => {
      const p = point.clone();
      p.setY(-p.y);
      return p;
    });
    const points = this.points.map((point) => {
      const p = point.clone();
      p.setY(-p.y);
      return p;
    });
    const ip = this.initialPosition.clone();
    ip.setY(-ip.y);
    const cog = this.centerOfGravity.clone();
    cog.setY(-cog.y);
    return new Body(`mirror_${this.name}`, fp, points, ip, this.mass, cog);
  }

  get inertialTensor(): Matrix3 {
    return new Matrix3();
  }

  set inertialTensor(mat: Matrix3) {
    // throw Error('Not Supported Exception');
  }

  constructor(
    name: string,
    fixedPoints: Array<Vector3>,
    points: Array<Vector3>,
    initialPosition?: Vector3,
    mass?: number,
    centerOfGravity?: Vector3
  ) {
    super(name);
    this.fixedPoints = fixedPoints;
    this.points = points;

    this.initialPosition = initialPosition ?? new Vector3();
    this.position = this.initialPosition;
    this.mass = mass ?? 0.001;
    this.centerOfGravity = centerOfGravity ?? new Vector3();
  }

  getDataElement(): IDataBody {
    const baseData = super.getDataElementBase();
    const gd3 = getDataVector3;

    const data: IDataBody = {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => gd3(point)),
      points: this.points.map((point) => gd3(point))
    };
    return data;
  }

  setDataElement(element: IDataBellCrank) {
    super.setDataElementBase(element);
    this.fixedPoints = element.fixedPoints.map((v) => getVector3(v).v);
    this.points = element.points.map((v) => getVector3(v).v);
  }
}

export class Tire extends Element implements ITire {
  get className(): string {
    return 'Tire';
  }

  visible: boolean | undefined = true;

  mass: number;

  centerOfGravity: Vector3;

  tireCenter: Vector3;

  toLeftBearing: number;

  toRightBearing: number;

  initialPosition: Vector3;

  position: Vector3;

  rotation: Matrix3 = new Matrix3();

  get leftBearing(): Vector3 {
    return this.tireCenter.clone().add(new Vector3(0, this.toLeftBearing, 0));
  }

  get rightBearing(): Vector3 {
    return this.tireCenter.clone().add(new Vector3(0, this.toRightBearing, 0));
  }

  get ground(): Vector3 {
    return this.tireCenter.clone().add(new Vector3(0, -this.tireCenter.y, 0));
  }

  getNodes(): NodeWithPath[] {
    return [
      {p: this.leftBearing, path: `leftBearing@${this.nodeID}`},
      {p: this.rightBearing, path: `rightBearing@${this.nodeID}`}
    ];
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position = this.initialPosition.clone().add(pp);
  }

  getMirror(): Tire {
    const center = this.tireCenter.clone();
    center.setY(-center.y);
    const ip = this.initialPosition.clone();
    ip.setY(-ip.y);
    const cog = this.centerOfGravity.clone();
    cog.setY(-cog.y);
    return new Tire(
      `mirror_${this.name}`,
      center,
      -this.toRightBearing,
      -this.toLeftBearing,
      ip,
      this.mass,
      cog
    );
  }

  get diameter(): Millimeter {
    return this.tireCenter.z * 2.0;
  }

  get inertialTensor(): Matrix3 {
    return new Matrix3();
  }

  set inertialTensor(mat: Matrix3) {
    // throw Error('Not Supported Exception');
  }

  constructor(
    name: string,
    tireCenter: Vector3,
    toLeftBearing: number,
    toRightBearing: number,
    initialPosition?: Vector3,
    mass?: number,
    centerOfGravity?: Vector3
  ) {
    super(name);
    this.tireCenter = tireCenter;
    this.toLeftBearing = toLeftBearing;
    this.toRightBearing = toRightBearing;
    this.initialPosition = initialPosition ?? new Vector3();
    this.position = this.initialPosition;
    this.mass = mass ?? 0.001;
    this.centerOfGravity = centerOfGravity ?? new Vector3();
  }

  getDataElement(): IDataTire {
    const baseData = super.getDataElementBase();
    const gd3 = getDataVector3;

    const data: IDataTire = {
      ...baseData,
      tireCenter: gd3(this.tireCenter),
      toLeftBearing: this.toLeftBearing,
      toRightBearing: this.toRightBearing
    };
    return data;
  }

  setDataElement(element: IDataTire) {
    super.setDataElementBase(element);
    this.tireCenter = getVector3(element.tireCenter).v;
    this.toLeftBearing = element.toLeftBearing;
    this.toRightBearing = element.toRightBearing;
  }
}
