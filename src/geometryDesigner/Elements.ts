/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import {Vector3, Matrix3} from 'three';
import {AtLeast1, AtLeast2} from '@app/utils/atLeast';
import {v1 as uuidv1} from 'uuid';
import {
  getDataMatrix3,
  getDataVector3,
  Millimeter,
  Joint,
  ElementID,
  NodeID,
  NodeWithPath,
  IElement,
  IAssembly,
  IDataAssembly,
  IBar,
  IDataBar,
  ISpringDumper,
  IDataSpringDumper,
  IAArm,
  IDataAArm,
  IBellCrank,
  IDataBellCrank,
  IBody,
  IDataBody,
  ITire,
  IDataTire
} from './IElements';

export abstract class Element {
  _nodeID: string;

  name: string;

  parent: IAssembly | null = null;

  get absPath(): string {
    return `${this.nodeID}${this.parent ? `@${this.parent.absPath}` : ''}`;
  }

  get nodeID(): string {
    return this._nodeID;
  }

  constructor(name: string) {
    this._nodeID = uuidv1(); // ⇨ '2c5ea4c0-4067-11e9-8bad-9b1deb4d3b7d'
    this.name = name;
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

  // _visible: boolean | undefined = true;

  get visible(): boolean | undefined {
    let allTrue = true;
    let allFalse = false;
    let undef = false;
    this.children.forEach((child) => {
      if (child.visible === undefined) {
        undef = true;
        return;
      }
      allTrue = allTrue && child.visible;
      allFalse = allFalse || child.visible;
    });
    if (undef) return undefined;
    if (allTrue) return true;
    if (!allFalse) return false;
    return undefined;
  }

  set visible(visibility: boolean | undefined) {
    this.children.forEach((child) => {
      child.visible = visibility;
    });
  }

  joints: Joint[];

  initialPosition: Vector3;

  get position(): Vector3 {
    return new Vector3();
  }

  set position(p: Vector3) {
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
      child.arrange(this.initialPosition.clone().add(pp));
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

    return new Assembly(`mirror_${this.name}`, children, joints);
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

  get inertialTensor(): Matrix3 {
    return new Matrix3();
  }

  set inertialTensor(mat: Matrix3) {
    // throw Error('Not Supported Exception');
  }

  constructor(
    name: string,
    children: IElement[],
    joints: Joint[],
    initialPosition?: Vector3
  ) {
    super(name);
    this._children = children;
    this.children.forEach((child) => {
      child.parent = this;
    });
    this.joints = joints;
    this.initialPosition = initialPosition ?? new Vector3();
    this.arrange();
  }

  getDataElement(): IDataAssembly {
    const data: IDataAssembly = {
      children: this.children.map((child) => child.getDataElement()),
      joints: [...this.joints],
      className: this.className,
      name: this.name,
      inertialTensor: getDataMatrix3(this.inertialTensor),
      nodeID: this.nodeID,
      absPath: this.absPath,

      position: getDataVector3(this.position),
      initialPosition: getDataVector3(this.initialPosition),
      visible: this.visible
    };
    return data;
  }
}

export class Frame extends Assembly {
  constructor(name: string, children: IElement[]) {
    const joints: Joint[] = [];
    super(name, children, joints);
  }
}

export class Bar extends Element implements IBar {
  get className(): string {
    return 'Bar';
  }

  visible: boolean | undefined = true;

  fixedPoint: Vector3;

  point: Vector3;

  initialPosition: Vector3;

  position: Vector3;

  rotation: Matrix3 = new Matrix3();

  getNodes(): NodeWithPath[] {
    return [
      {p: this.fixedPoint, path: `fixedPoint@${this.nodeID}`},
      {p: this.point, path: `point@${this.nodeID}`}
    ];
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position = this.initialPosition.clone().add(pp);
  }

  getMirror(): Bar {
    const fp = this.fixedPoint.clone();
    fp.setY(-fp.y);
    const p = this.point.clone();
    p.setY(-p.y);
    return new Bar(`mirror_${this.name}`, fp, p);
  }

  get inertialTensor(): Matrix3 {
    return new Matrix3();
  }

  set inertialTensor(mat: Matrix3) {
    // throw Error('Not Supported Exception');
  }

  constructor(
    name: string,
    fixedPoint: Vector3,
    point: Vector3,
    initialPosition?: Vector3
  ) {
    super(name);
    this.fixedPoint = fixedPoint;
    this.point = point;
    this.initialPosition = initialPosition ?? new Vector3();
    this.position = this.initialPosition;
  }

  getDataElement(): IDataBar {
    const data: IDataBar = {
      className: this.className,
      name: this.name,
      inertialTensor: getDataMatrix3(this.inertialTensor),
      nodeID: this.nodeID,
      absPath: this.absPath,
      position: getDataVector3(this.position),
      initialPosition: getDataVector3(this.initialPosition),

      fixedPoint: getDataVector3(this.fixedPoint),
      point: getDataVector3(this.point),
      visible: this.visible
    };
    return data;
  }
}

export class SpringDumper extends Element implements ISpringDumper {
  get className(): string {
    return 'SpringDumper';
  }

  visible: boolean | undefined = true;

  fixedPoint: Vector3;

  point: Vector3;

  initialPosition: Vector3;

  position: Vector3;

  rotation: Matrix3 = new Matrix3();

  getNodes(): NodeWithPath[] {
    return [
      {p: this.fixedPoint, path: `fixedPoint@${this.nodeID}`},
      {p: this.point, path: `point@${this.nodeID}`}
    ];
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position = this.initialPosition.clone().add(pp);
  }

  getMirror(): SpringDumper {
    const fp = this.fixedPoint.clone();
    fp.setY(-fp.y);
    const p = this.point.clone();
    p.setY(-p.y);
    return new SpringDumper(
      `mirror_${this.name}`,
      fp,
      p,
      this.dlMin,
      this.dlMax
    );
  }

  dlMin: Millimeter;

  dlMax: Millimeter;

  get inertialTensor(): Matrix3 {
    return new Matrix3();
  }

  set inertialTensor(mat: Matrix3) {
    // throw Error('Not Supported Exception');
  }

  constructor(
    name: string,
    fixedPoint: Vector3,
    point: Vector3,
    dlMin: Millimeter,
    dlMax: Millimeter,
    initialPosition?: Vector3
  ) {
    super(name);
    this.fixedPoint = fixedPoint;
    this.point = point;
    this.dlMin = dlMin;
    this.dlMax = dlMax;
    this.initialPosition = initialPosition ?? new Vector3();
    this.position = this.initialPosition;
  }

  getDataElement(): IDataSpringDumper {
    const data: IDataSpringDumper = {
      visible: this.visible,
      className: this.className,
      name: this.name,
      inertialTensor: getDataMatrix3(this.inertialTensor),
      nodeID: this.nodeID,
      absPath: this.absPath,
      position: getDataVector3(this.position),
      initialPosition: getDataVector3(this.initialPosition),

      fixedPoint: getDataVector3(this.fixedPoint),
      point: getDataVector3(this.point),
      dlMin: this.dlMin,
      dlMax: this.dlMax
    };
    return data;
  }
}

export class AArm extends Element implements IAArm {
  get className(): string {
    return 'AArm';
  }

  visible: boolean | undefined = true;

  fixedPoints: [Vector3, Vector3];

  points: AtLeast1<Vector3>;

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

  getMirror(): AArm {
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
    return new AArm(`mirror_${this.name}`, fp, [point0, ...points]);
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
    points: AtLeast1<Vector3>,
    initialPosition?: Vector3
  ) {
    super(name);
    this.fixedPoints = fixedPoints;
    this.points = points;
    this.initialPosition = initialPosition ?? new Vector3();
    this.position = this.initialPosition;
  }

  getDataElement(): IDataAArm {
    const gd3 = getDataVector3;

    const data: IDataAArm = {
      visible: this.visible,
      className: this.className,
      name: this.name,
      inertialTensor: getDataMatrix3(this.inertialTensor),
      nodeID: this.nodeID,
      absPath: this.absPath,
      position: gd3(this.position),
      initialPosition: gd3(this.initialPosition),
      fixedPoints: this.fixedPoints.map((point) => gd3(point)),
      points: this.points.map((point) => gd3(point))
    };
    return data;
  }
}

export class BellCrank extends Element implements IBellCrank {
  get className(): string {
    return 'BellCrank';
  }

  visible: boolean | undefined = true;

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
    return new BellCrank(`mirror_${this.name}`, fp, [
      point0,
      point1,
      ...points
    ]);
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
    initialPosition?: Vector3
  ) {
    super(name);
    this.fixedPoints = fixedPoints;
    this.points = points;
    this.initialPosition = initialPosition ?? new Vector3();
    this.position = this.initialPosition;
  }

  getDataElement(): IDataBellCrank {
    const gd3 = getDataVector3;

    const data: IDataBellCrank = {
      visible: this.visible,
      className: this.className,
      name: this.name,
      inertialTensor: getDataMatrix3(this.inertialTensor),
      nodeID: this.nodeID,
      absPath: this.absPath,
      position: gd3(this.position),
      initialPosition: gd3(this.initialPosition),
      fixedPoints: this.fixedPoints.map((point) => gd3(point)),
      points: this.points.map((point) => gd3(point))
    };
    return data;
  }
}

export class Body extends Element implements IBody {
  get className(): string {
    return 'Body';
  }

  visible: boolean | undefined = true;

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
    return new Body(`mirror_${this.name}`, fp, points);
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
    initialPosition?: Vector3
  ) {
    super(name);
    this.fixedPoints = fixedPoints;
    this.points = points;

    this.initialPosition = initialPosition ?? new Vector3();
    this.position = this.initialPosition;
  }

  getDataElement(): IDataBody {
    const gd3 = getDataVector3;

    const data: IDataBody = {
      visible: this.visible,
      className: this.className,
      name: this.name,
      inertialTensor: getDataMatrix3(this.inertialTensor),
      nodeID: this.nodeID,
      absPath: this.absPath,
      position: gd3(this.position),
      initialPosition: gd3(this.initialPosition),
      fixedPoints: this.fixedPoints.map((point) => gd3(point)),
      points: this.points.map((point) => gd3(point))
    };
    return data;
  }
}

export class Tire extends Element implements ITire {
  get className(): string {
    return 'Tire';
  }

  visible: boolean | undefined = true;

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
    return new Tire(
      `mirror_${this.name}`,
      center,
      -this.toRightBearing,
      -this.toLeftBearing
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
    initialPosition?: Vector3
  ) {
    super(name);
    this.tireCenter = tireCenter;
    this.toLeftBearing = toLeftBearing;
    this.toRightBearing = toRightBearing;
    this.initialPosition = initialPosition ?? new Vector3();
    this.position = this.initialPosition;
  }

  getDataElement(): IDataTire {
    const gd3 = getDataVector3;

    const data: IDataTire = {
      visible: this.visible,
      className: this.className,
      name: this.name,
      inertialTensor: getDataMatrix3(this.inertialTensor),
      nodeID: this.nodeID,
      absPath: this.absPath,
      position: gd3(this.position),
      initialPosition: gd3(this.initialPosition),
      tireCenter: this.tireCenter,
      toLeftBearing: this.toLeftBearing,
      toRightBearing: this.toRightBearing
    };
    return data;
  }
}
