/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import {Vector3, Matrix3} from 'three';
import {AtLeast1, AtLeast2} from '@app/utils/atLeast';
import {v1 as uuidv1} from 'uuid';
import {
  Millimeter,
  Joint,
  ElementID,
  NodeID,
  NodeWithInfo,
  IElement,
  IAssembly,
  IBar,
  ISpringDumper,
  IAArm,
  IBellCrank,
  IBody,
  ITire
} from './IElements';

export abstract class Element {
  _nodeID: string;

  get nodeID(): string {
    return this._nodeID;
  }

  constructor() {
    this._nodeID = uuidv1(); // ⇨ '2c5ea4c0-4067-11e9-8bad-9b1deb4d3b7d'
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
  }

  name: string;

  joints: Joint[];

  initialPosition: Vector3;

  get position(): Vector3 {
    return new Vector3();
  }

  set position(p: Vector3) {
    throw Error('Not Supported Exception');
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

  getNodes(): NodeWithInfo[] {
    // eslint-disable-next-line no-array-constructor
    let points = new Array<NodeWithInfo>();
    this.children.forEach((element, elementID) => {
      let pis = element.getNodes();
      const jointedNodeIDs = this.getJointedNodeIDs(elementID);
      pis = pis.filter((_, i) => !jointedNodeIDs.includes(i));
      pis = pis.map((pi) => {
        return {p: pi.p, info: `${pi.info}@${this.name}`};
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

  getJoints(): NodeWithInfo[] {
    // eslint-disable-next-line no-array-constructor
    let points = new Array<NodeWithInfo>();
    this.children.forEach((element, elementID) => {
      let pis = element.getNodes();
      const jointedNodeIDs = this.getJointedNodeIDs(elementID);
      pis = pis.filter((_, i) => jointedNodeIDs.includes(i));
      pis = pis.map((pi) => {
        return {p: pi.p, info: pi.info};
      });
      points = [...points, ...pis];
    });
    return points;
  }

  get inertialTensor(): Matrix3 {
    return new Matrix3();
  }

  set inertialTensor(mat: Matrix3) {
    throw Error('Not Supported Exception');
  }

  constructor(
    name: string,
    children: IElement[],
    joints: Joint[],
    initialPosition?: Vector3
  ) {
    super();
    this.name = name;
    this._children = children;
    this.joints = joints;
    this.initialPosition = initialPosition ?? new Vector3();
    this.arrange();
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

  name: string;

  fixedPoint: Vector3;

  point: Vector3;

  initialPosition: Vector3;

  position: Vector3;

  rotation: Matrix3 = new Matrix3();

  getNodes(): NodeWithInfo[] {
    return [
      {p: this.fixedPoint, info: `fixedPoint@${this.name}`},
      {p: this.point, info: `point@${this.name}`}
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
    throw Error('Not Supported Exception');
  }

  constructor(
    name: string,
    fixedPoint: Vector3,
    point: Vector3,
    initialPosition?: Vector3
  ) {
    super();
    this.name = name;
    this.fixedPoint = fixedPoint;
    this.point = point;
    this.initialPosition = initialPosition ?? new Vector3();
    this.position = this.initialPosition;
  }
}

export class SpringDumper extends Element implements ISpringDumper {
  get className(): string {
    return 'SpringDumper';
  }

  name: string;

  fixedPoint: Vector3;

  point: Vector3;

  initialPosition: Vector3;

  position: Vector3;

  rotation: Matrix3 = new Matrix3();

  getNodes(): NodeWithInfo[] {
    return [
      {p: this.fixedPoint, info: `fixedPoint@${this.name}`},
      {p: this.point, info: `point@${this.name}`}
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
    throw Error('Not Supported Exception');
  }

  constructor(
    name: string,
    fixedPoint: Vector3,
    point: Vector3,
    dlMin: Millimeter,
    dlMax: Millimeter,
    initialPosition?: Vector3
  ) {
    super();
    this.name = name;
    this.fixedPoint = fixedPoint;
    this.point = point;
    this.dlMin = dlMin;
    this.dlMax = dlMax;
    this.initialPosition = initialPosition ?? new Vector3();
    this.position = this.initialPosition;
  }
}

export class AArm extends Element implements IAArm {
  get className(): string {
    return 'AArm';
  }

  name: string;

  fixedPoints: [Vector3, Vector3];

  points: AtLeast1<Vector3>;

  initialPosition: Vector3;

  position: Vector3;

  rotation: Matrix3 = new Matrix3();

  getNodes(): NodeWithInfo[] {
    const fp = this.fixedPoints.map((point, i): NodeWithInfo => {
      return {p: point, info: `fixedPoint:${i}@${this.name}`};
    });
    const p = this.points.map((point, i): NodeWithInfo => {
      return {p: point, info: `point:${i}@${this.name}`};
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
    throw Error('Not Supported Exception');
  }

  constructor(
    name: string,
    fixedPoints: [Vector3, Vector3],
    points: AtLeast1<Vector3>,
    initialPosition?: Vector3
  ) {
    super();
    this.name = name;
    this.fixedPoints = fixedPoints;
    this.points = points;
    this.initialPosition = initialPosition ?? new Vector3();
    this.position = this.initialPosition;
  }
}

export class BellCrank extends Element implements IBellCrank {
  get className(): string {
    return 'BellCrank';
  }

  name: string;

  fixedPoints: [Vector3, Vector3];

  points: AtLeast2<Vector3>;

  initialPosition: Vector3;

  position: Vector3;

  rotation: Matrix3 = new Matrix3();

  getNodes(): NodeWithInfo[] {
    const fp = this.fixedPoints.map((point, i): NodeWithInfo => {
      return {p: point, info: `fixedPoint:${i}@${this.name}`};
    });
    const p = this.points.map((point, i): NodeWithInfo => {
      return {p: point, info: `point:${i}@${this.name}`};
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
    throw Error('Not Supported Exception');
  }

  constructor(
    name: string,
    fixedPoints: [Vector3, Vector3],
    points: AtLeast2<Vector3>,
    initialPosition?: Vector3
  ) {
    super();
    this.name = name;
    this.fixedPoints = fixedPoints;
    this.points = points;
    this.initialPosition = initialPosition ?? new Vector3();
    this.position = this.initialPosition;
  }
}

export class Body extends Element implements IBody {
  get className(): string {
    return 'Body';
  }

  name: string;

  fixedPoints: Array<Vector3>;

  points: Array<Vector3>;

  initialPosition: Vector3;

  position: Vector3;

  rotation: Matrix3 = new Matrix3();

  getNodes(): NodeWithInfo[] {
    const fp = this.fixedPoints.map((point, i): NodeWithInfo => {
      return {p: point, info: `fixedPoint:${i}@${this.name}`};
    });
    const p = this.points.map((point, i): NodeWithInfo => {
      return {p: point, info: `point:${i}@${this.name}`};
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
    throw Error('Not Supported Exception');
  }

  constructor(
    name: string,
    fixedPoints: Array<Vector3>,
    points: Array<Vector3>,
    initialPosition?: Vector3
  ) {
    super();
    this.name = name;
    this.fixedPoints = fixedPoints;
    this.points = points;

    this.initialPosition = initialPosition ?? new Vector3();
    this.position = this.initialPosition;
  }
}

export class Tire extends Element implements ITire {
  get className(): string {
    return 'Tire';
  }

  name: string;

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

  getNodes(): NodeWithInfo[] {
    return [
      {p: this.leftBearing, info: `leftBearing@${this.name}`},
      {p: this.rightBearing, info: `rightBearing@${this.name}`}
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
    throw Error('Not Supported Exception');
  }

  constructor(
    name: string,
    tireCenter: Vector3,
    toLeftBearing: number,
    toRightBearing: number,
    initialPosition?: Vector3
  ) {
    super();
    this.name = name;
    this.tireCenter = tireCenter;
    this.toLeftBearing = toLeftBearing;
    this.toRightBearing = toRightBearing;
    this.initialPosition = initialPosition ?? new Vector3();
    this.position = this.initialPosition;
  }
}
