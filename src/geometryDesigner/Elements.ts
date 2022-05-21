/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import {Vector3, Matrix3} from 'three';
import {AtLeast1, AtLeast2} from '@app/utils/atLeast';
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

export class Assembly implements IAssembly {
  get className(): string {
    return 'Assembly';
  }

  _children: Array<IElement>;

  get children(): IElement[] {
    return this._children;
  }

  set children(elements: IElement[]) {
    this._children = elements;
  }

  name: string;

  joints: Joint[];

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

  constructor(name: string, children: IElement[], joints: Joint[]) {
    this.name = name;
    this._children = children;
    this.joints = joints;
  }
}

export class Bar implements IBar {
  get className(): string {
    return 'Bar';
  }

  name: string;

  fixedPoint: Vector3;

  point: Vector3;

  position?: Vector3;

  rotation?: Matrix3;

  getNodes(): NodeWithInfo[] {
    return [
      {p: this.fixedPoint, info: `fixedPoint@${this.name}`},
      {p: this.point, info: `point@${this.name}`}
    ];
  }

  get inertialTensor(): Matrix3 {
    return new Matrix3();
  }

  set inertialTensor(mat: Matrix3) {
    throw Error('Not Supported Exception');
  }

  constructor(name: string, fixedPoint: Vector3, point: Vector3) {
    this.name = name;
    this.fixedPoint = fixedPoint;
    this.point = point;
  }
}

export class SpringDumper implements ISpringDumper {
  get className(): string {
    return 'SpringDumper';
  }

  name: string;

  fixedPoint: Vector3;

  point: Vector3;

  position?: Vector3;

  rotation?: Matrix3;

  getNodes(): NodeWithInfo[] {
    return [
      {p: this.fixedPoint, info: `fixedPoint@${this.name}`},
      {p: this.point, info: `point@${this.name}`}
    ];
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
    dlMax: Millimeter
  ) {
    this.name = name;
    this.fixedPoint = fixedPoint;
    this.point = point;
    this.dlMin = dlMin;
    this.dlMax = dlMax;
  }
}

export class AArm implements IAArm {
  get className(): string {
    return 'AArm';
  }

  name: string;

  fixedPoints: [Vector3, Vector3];

  points: AtLeast1<Vector3>;

  position?: Vector3;

  rotation?: Matrix3;

  getNodes(): NodeWithInfo[] {
    const fp = this.fixedPoints.map((point, i): NodeWithInfo => {
      return {p: point, info: `fixedPoint:${i}@${this.name}`};
    });
    const p = this.points.map((point, i): NodeWithInfo => {
      return {p: point, info: `point:${i}@${this.name}`};
    });

    return [...fp, ...p];
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
    points: AtLeast1<Vector3>
  ) {
    this.name = name;
    this.fixedPoints = fixedPoints;
    this.points = points;
  }
}

export class BellCrank implements IBellCrank {
  get className(): string {
    return 'BellCrank';
  }

  name: string;

  fixedPoints: [Vector3, Vector3];

  points: AtLeast2<Vector3>;

  position?: Vector3;

  rotation?: Matrix3;

  getNodes(): NodeWithInfo[] {
    const fp = this.fixedPoints.map((point, i): NodeWithInfo => {
      return {p: point, info: `fixedPoint:${i}@${this.name}`};
    });
    const p = this.points.map((point, i): NodeWithInfo => {
      return {p: point, info: `point:${i}@${this.name}`};
    });

    return [...fp, ...p];
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
    points: AtLeast2<Vector3>
  ) {
    this.name = name;
    this.fixedPoints = fixedPoints;
    this.points = points;
  }
}

export class Body implements IBody {
  get className(): string {
    return 'Body';
  }

  name: string;

  fixedPoints: Array<Vector3>;

  points: Array<Vector3>;

  position?: Vector3;

  rotation?: Matrix3;

  getNodes(): NodeWithInfo[] {
    const fp = this.fixedPoints.map((point, i): NodeWithInfo => {
      return {p: point, info: `fixedPoint:${i}@${this.name}`};
    });
    const p = this.points.map((point, i): NodeWithInfo => {
      return {p: point, info: `point:${i}@${this.name}`};
    });

    return [...fp, ...p];
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
    points: Array<Vector3>
  ) {
    this.name = name;
    this.fixedPoints = fixedPoints;
    this.points = points;
  }
}

export class Tire implements ITire {
  get className(): string {
    return 'Tire';
  }

  name: string;

  tireCenter: Vector3;

  toLeftBearing: number;

  toRightBearing: number;

  position?: Vector3;

  rotation?: Matrix3;

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
    toRightBearing: number
  ) {
    this.name = name;
    this.tireCenter = tireCenter;
    this.toLeftBearing = toLeftBearing;
    this.toRightBearing = toRightBearing;
  }
}
