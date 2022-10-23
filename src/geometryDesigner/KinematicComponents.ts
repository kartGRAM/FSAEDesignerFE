/* eslint-disable no-lone-blocks */
/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {Matrix, SingularValueDecomposition} from 'ml-matrix';
import {
  IElement,
  IAssembly,
  isAArm,
  isBar,
  isTire,
  isSpringDumper,
  isSimplifiedElement,
  IAArm,
  IBar,
  ITire,
  JointAsVector3
} from '@gd/IElements';
import {INamedVector3} from '@gd/INamedValues';
import {Vector3, Quaternion} from 'three';
import {AtLeast1} from '@utils/atLeast';
import {
  getStableOrthogonalVector,
  setSubMatrix,
  skew,
  rotationMatrix,
  decompositionMatrixG,
  getJointDictionary,
  canSimplifyAArm,
  getJointPartner,
  isFixedElement,
  getJointsToOtherComponents,
  getNamedVector3FromJoint,
  getIndexOfPoint,
  equal
} from './KinematicFunctions';

const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;
const Q1 = 4;
const Q2 = 5;
const Q3 = 6;

export interface Constraint {
  readonly lhs: Component;
  readonly rhs: Component;
  row: number;
  constraints: number;
  readonly name: string;
  setJacobianAndConstraints(phi_q: Matrix, phi: number[]): void;
}

export class Sphere implements Constraint {
  constraints = 3; // 自由度を3減らす

  row: number = -1;

  lhs: Component;

  rhs: Component;

  lLocalVec: Vector3;

  lLocalSkew: Matrix;

  rLocalVec: Vector3;

  rLocalSkew: Matrix;

  target: Vector3 = new Vector3();

  name: string;

  isFixed: boolean = false;

  constructor(
    name: string,
    clhs: Component,
    crhs: Component,
    ilhs: number,
    irhs: number
  ) {
    this.name = name;
    if (clhs.isFixed) {
      if (crhs.isFixed) throw new Error('拘束式の両端が固定されている');
      // 固定側はrhsにする
      this.lhs = crhs;
      this.rhs = clhs;
      const tmp = ilhs;
      ilhs = irhs;
      irhs = tmp;
    } else {
      this.lhs = clhs;
      this.rhs = crhs;
    }

    this.lLocalVec = this.lhs.localVectors[ilhs].clone();
    this.lLocalSkew = skew(this.lLocalVec).mul(2);
    this.rLocalVec = this.rhs.localVectors[irhs].clone();
    this.rLocalSkew = skew(this.rLocalVec).mul(-2);
    if (this.rhs.isFixed) {
      this.isFixed = true;
      this.target = this.rhs.position
        .clone()
        .add(this.rLocalVec.applyQuaternion(this.rhs.quaternion));
    }
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const cLhs = this.lhs.col;
    const {row, lhs, lLocalVec, lLocalSkew} = this;
    const qLhs = lhs.quaternion;
    const ALhs = rotationMatrix(qLhs);
    const GLhs = decompositionMatrixG(qLhs);
    const sLhs = lLocalVec.clone().applyQuaternion(qLhs);

    // 始点位置拘束
    if (!this.isFixed) {
      const {rhs, rLocalVec, rLocalSkew} = this;
      const cRhs = this.rhs.col;
      const qRhs = rhs.quaternion;
      const ARhs = rotationMatrix(qRhs);
      const GRhs = decompositionMatrixG(qRhs);
      const sRhs = rLocalVec.clone().applyQuaternion(qRhs);
      const constraint = lhs.position
        .clone()
        .add(sLhs)
        .sub(rhs.position)
        .sub(sRhs);
      phi[row + X] = constraint.x;
      phi[row + Y] = constraint.y;
      phi[row + Z] = constraint.z;
      // diff of positions are 1
      phi_q.set(row + X, cLhs + X, 1);
      phi_q.set(row + Y, cLhs + Y, 1);
      phi_q.set(row + Z, cLhs + Z, 1);
      phi_q.set(row + X, cRhs + X, -1);
      phi_q.set(row + Y, cRhs + Y, -1);
      phi_q.set(row + Z, cRhs + Z, -1);
      setSubMatrix(row + X, cLhs + Q0, phi_q, ALhs.mmul(lLocalSkew).mmul(GLhs));
      setSubMatrix(row + X, cRhs + Q0, phi_q, ARhs.mmul(rLocalSkew).mmul(GRhs));
    } else {
      const constraint = lhs.position.clone().add(sLhs).sub(this.target);
      phi[row + X] = constraint.x;
      phi[row + Y] = constraint.y;
      phi[row + Z] = constraint.z;
      // diff of positions are 1
      phi_q.set(row + X, cLhs + X, 1);
      phi_q.set(row + Y, cLhs + Y, 1);
      phi_q.set(row + Z, cLhs + Z, 1);
      setSubMatrix(row + X, cLhs + Q0, phi_q, ALhs.mmul(lLocalSkew).mmul(GLhs));
    }
  }
}

export class Hinge implements Constraint {
  constraints = 5; // 自由度を5減らす

  row: number = -1;

  lhs: Component;

  rhs: Component;

  lLocalVec: Vector3;

  lLocalSkew: Matrix;

  // 軸に垂直なベクトル
  lOrthogonalVec: [Vector3, Vector3];

  lOrthogonalSkew: [Matrix, Matrix];

  rLocalVec: Vector3;

  rLocalSkew: Matrix;

  rAxisVec: Vector3;

  rAxisSkew: Matrix;

  target: Vector3 = new Vector3();

  name: string;

  isFixed: boolean = false;

  constructor(
    name: string,
    clhs: Component,
    crhs: Component,
    ilhs: [number, number],
    irhs: [number, number]
  ) {
    this.name = name;
    if (crhs.isFixed) {
      if (clhs.isFixed) throw new Error('拘束式の両端が固定されている');
      // 固定側はlhsにする
      this.lhs = crhs;
      this.rhs = clhs;
      const tmp = ilhs;
      ilhs = irhs;
      irhs = tmp;
    } else {
      this.lhs = clhs;
      this.rhs = crhs;
    }
    this.lLocalVec = this.lhs.localVectors[ilhs[0]].clone();
    this.lLocalSkew = skew(this.lLocalVec).mul(2);
    this.rLocalVec = this.rhs.localVectors[irhs[0]].clone();
    this.rLocalSkew = skew(this.rLocalVec).mul(-2);
    this.rAxisVec = this.rhs.localVectors[irhs[1]].clone().sub(this.rLocalVec);
    this.rAxisSkew = skew(this.rAxisVec).mul(2);
    const lAxisVec = this.lhs.localVectors[ilhs[1]].clone().sub(this.lLocalVec);
    if (
      this.rAxisVec.lengthSq() < Number.EPSILON ||
      lAxisVec.lengthSq() < Number.EPSILON
    ) {
      throw new Error('ヒンジを構成する2点が近すぎます');
    }
    const oVec1 = getStableOrthogonalVector(lAxisVec);
    const oVec2 = lAxisVec.cross(oVec1);
    if (this.lhs.isFixed) {
      this.isFixed = true;
      this.target = this.lhs.position
        .clone()
        .add(this.lLocalVec.applyQuaternion(this.lhs.quaternion));
      oVec1.applyQuaternion(this.lhs.quaternion);
      oVec2.applyQuaternion(this.lhs.quaternion);
    }
    this.lOrthogonalVec = [oVec1, oVec2];
    this.lOrthogonalSkew = [
      skew(this.lOrthogonalVec[0]).mul(2),
      skew(this.lOrthogonalVec[1]).mul(2)
    ];
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const cRhs = this.rhs.col;
    const cLhs = this.lhs.col;
    const {
      row,
      rhs,
      rLocalVec,
      rLocalSkew,
      rAxisVec,
      rAxisSkew,
      lhs,
      lLocalVec,
      lLocalSkew
    } = this;
    const qRhs = rhs.quaternion;
    const ARhs = rotationMatrix(qRhs);
    const GRhs = decompositionMatrixG(qRhs);
    const sRhs = rLocalVec.clone().applyQuaternion(qRhs);
    const qLhs = lhs.quaternion;
    const ALhs = rotationMatrix(qLhs);
    const GLhs = decompositionMatrixG(qLhs);

    // 始点位置拘束
    if (!this.isFixed) {
      const sLhs = lLocalVec.clone().applyQuaternion(qLhs);
      const constraint = lhs.position
        .clone()
        .add(sLhs)
        .sub(rhs.position)
        .sub(sRhs);
      phi[row + X] = constraint.x;
      phi[row + Y] = constraint.y;
      phi[row + Z] = constraint.z;
      // diff of positions are 1
      phi_q.set(row + X, cLhs + X, 1);
      phi_q.set(row + Y, cLhs + Y, 1);
      phi_q.set(row + Z, cLhs + Z, 1);
      phi_q.set(row + X, cRhs + X, -1);
      phi_q.set(row + Y, cRhs + Y, -1);
      phi_q.set(row + Z, cRhs + Z, -1);
      setSubMatrix(row + X, cLhs + Q0, phi_q, ALhs.mmul(lLocalSkew).mmul(GLhs));
      setSubMatrix(row + X, cRhs + Q0, phi_q, ARhs.mmul(rLocalSkew).mmul(GRhs));
    } else {
      const constraint = this.target.clone().sub(rhs.position).sub(sRhs);
      phi[row + X] = constraint.x;
      phi[row + Y] = constraint.y;
      phi[row + Z] = constraint.z;
      // diff of positions are 1
      phi_q.set(row + X, cRhs + X, -1);
      phi_q.set(row + Y, cRhs + Y, -1);
      phi_q.set(row + Z, cRhs + Z, -1);
      setSubMatrix(row + X, cRhs + Q0, phi_q, ARhs.mmul(rLocalSkew).mmul(GRhs));
    }

    // 並行拘束
    const axis = rAxisVec.clone().applyQuaternion(qRhs);
    const axisT = new Matrix([[axis.x, axis.y, axis.z]]); // (1x3)
    const axisDelta = ARhs.mmul(rAxisSkew).mmul(GRhs); // (3x4)
    for (let r = 0; r < 2; ++r) {
      let orthoVec = this.lOrthogonalVec[r];
      if (!this.isFixed) {
        orthoVec = orthoVec.clone().applyQuaternion(qLhs);
        const orthoDelta = ALhs.mmul(this.lOrthogonalSkew[r]).mmul(GLhs); // (3x4)
        const dLhs = axisT.mmul(orthoDelta); // (1x3) x (3x4) = (1x4)
        setSubMatrix(row + 3 + r, cLhs + Q0, phi_q, dLhs);
      }
      const orthoT = new Matrix([[orthoVec.x, orthoVec.y, orthoVec.z]]); // (1x3)
      phi[r + row + 3] = orthoVec.dot(axis);
      const dRhs = orthoT.mmul(axisDelta); // (1x3) x (3x4) = (1x4)
      setSubMatrix(row + 3 + r, cRhs + Q0, phi_q, dRhs);
    }
  }
}

export class BarAndSpheres implements Constraint {
  constraints = 1; // 自由度を1減らす

  row: number = -1;

  lhs: Component;

  rhs: Component;

  lLocalVec: Vector3;

  lLocalSkew: Matrix;

  rLocalVec: Vector3;

  rLocalSkew: Matrix;

  l2: number;

  name: string;

  target: Vector3 = new Vector3();

  isFixed: boolean = false;

  constructor(
    name: string,
    clhs: Component,
    crhs: Component,
    ilhs: number,
    irhs: number,
    l: number
  ) {
    this.name = name;
    if (clhs.isFixed) {
      if (crhs.isFixed) throw new Error('拘束式の両端が固定されている');
      // 固定側はrhsにする
      this.lhs = crhs;
      this.rhs = clhs;
      const tmp = ilhs;
      ilhs = irhs;
      irhs = tmp;
    } else {
      this.lhs = clhs;
      this.rhs = crhs;
    }
    this.lLocalVec = this.lhs.localVectors[ilhs].clone();
    this.lLocalSkew = skew(this.lLocalVec).mul(2);
    this.rLocalVec = this.rhs.localVectors[irhs].clone();
    this.rLocalSkew = skew(this.rLocalVec).mul(-2);
    if (this.rhs.isFixed) {
      this.isFixed = true;
      this.target = this.rhs.position
        .clone()
        .add(this.rLocalVec.applyQuaternion(this.rhs.quaternion));
    }
    this.l2 = l * l;
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const cLhs = this.lhs.col;
    const {row, lhs, lLocalVec, lLocalSkew, l2} = this;
    const qLhs = lhs.quaternion;
    const ALhs = rotationMatrix(qLhs);
    const GLhs = decompositionMatrixG(qLhs);
    const sLhs = lLocalVec.clone().applyQuaternion(qLhs);

    if (!this.isFixed) {
      const {rhs, rLocalVec, rLocalSkew} = this;
      const cRhs = this.rhs.col;
      const qRhs = rhs.quaternion;
      const ARhs = rotationMatrix(qRhs);
      const GRhs = decompositionMatrixG(qRhs);
      const sRhs = rLocalVec.clone().applyQuaternion(qRhs);
      const d = lhs.position.clone().add(sLhs).sub(rhs.position).sub(sRhs);
      const dT = new Matrix([[d.x * 2, d.y * 2, d.z * 2]]); // (1x3)
      phi[row] = d.lengthSq() - l2;

      setSubMatrix(row, cLhs + X, phi_q, dT);
      setSubMatrix(row, cRhs + X, phi_q, dT.clone().mul(-1));
      setSubMatrix(
        row,
        cLhs + Q0,
        phi_q,
        dT.mmul(ALhs).mmul(lLocalSkew).mmul(GLhs)
      );
      setSubMatrix(
        row,
        cRhs + Q0,
        phi_q,
        dT.mmul(ARhs).mmul(rLocalSkew).mmul(GRhs)
      );
    } else {
      const d = lhs.position.clone().add(sLhs).sub(this.target);
      const dT = new Matrix([[d.x * 2, d.y * 2, d.z * 2]]); // (1x3)
      phi[row] = d.lengthSq() - l2;

      setSubMatrix(row, cLhs + X, phi_q, dT);
      setSubMatrix(
        row,
        cLhs + Q0,
        phi_q,
        dT.mmul(ALhs).mmul(lLocalSkew).mmul(GLhs) // (1x3) x (3x3) x(3x3) x (3x4) = (1x4)
      );
    }
  }
}

export class QuaternionConstraint implements Constraint {
  constraints = 1; // 自由度を1減らす

  row: number = -1;

  component: Component;

  get lhs() {
    return this.component;
  }

  get rhs() {
    return this.component;
  }

  name: string;

  constructor(name: string, component: Component) {
    this.name = name;
    this.component = component;
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row, component} = this;
    const {col} = component;
    const q = component.quaternion;

    const e0 = q.w;
    const e1 = q.x;
    const e2 = q.y;
    const e3 = q.z;
    phi[row] = e0 * e0 + e1 * e1 + e2 * e2 + e3 * e3 - 1;

    phi_q.set(row, col + Q0, 2 * e0);
    phi_q.set(row, col + Q1, 2 * e1);
    phi_q.set(row, col + Q2, 2 * e2);
    phi_q.set(row, col + Q3, 2 * e3);
  }
}

// elementの初期状態を取得し、計算後に反映する。
// ただし、Bar, Tire, SpringDumperなど自由度の小さいElementは含まれない
export class Component {
  readonly name: string;

  // ヤコビアンの列番号
  _col: number = -1;

  setCol(col: number) {
    this._col = col;
  }

  get col(): number {
    if (this.isRelativeFixed) return this.parent.col;
    return this._col;
  }

  // 自由度
  get degreeOfFreedom(): number {
    if (this.isExcludedComponent) return 0;
    return 7;
  }

  // 正規化用の拘束式を得る
  getConstraintToNormalize(): Constraint | null {
    if (this.isExcludedComponent) return null;

    return new QuaternionConstraint('quaternion constraint', this);
  }

  applyDq(dq: Matrix) {
    if (this._col === -1) return;
    const {col} = this;
    if (this.degreeOfFreedom === 7) {
      const dx = dq.get(col + X, 0);
      const dy = dq.get(col + Y, 0);
      const dz = dq.get(col + Z, 0);
      const dq0 = dq.get(col + Q0, 0);
      const dq1 = dq.get(col + Q1, 0);
      const dq2 = dq.get(col + Q2, 0);
      const dq3 = dq.get(col + Q3, 0);
      this._position.x -= dx;
      this._position.y -= dy;
      this._position.z -= dz;
      this._quaternion.w -= dq0;
      this._quaternion.x -= dq1;
      this._quaternion.y -= dq2;
      this._quaternion.z -= dq3;
    }
  }

  element: IElement;

  applyResultToElement() {
    if (this._col === -1) return;
    if (this.degreeOfFreedom === 7) {
      this.element.position.value = this.position;
      this.element.rotation.value = this.quaternion;
    }
  }

  _position: Vector3;

  get position() {
    if (this.isRelativeFixed) return this.parent.position;
    return this._position;
  }

  set position(value: Vector3) {
    if (this.isRelativeFixed) {
      this.parent.position = value;
    }
    this._position = value;
  }

  _quaternion: Quaternion;

  get quaternion() {
    if (this.isRelativeFixed) return this.parent.quaternion;
    return this._quaternion;
  }

  set quaternion(value: Quaternion) {
    if (this.isRelativeFixed) {
      this.parent.quaternion = value;
    }
    this._quaternion = value;
  }

  localVectors: Vector3[];

  _isFixed: boolean = false;

  get isFixed(): boolean {
    if (this._isFixed) return true;
    if (this.isRelativeFixed) {
      let {parent} = this;
      while (parent.isRelativeFixed) {
        parent = parent.parent;
      }
      if (parent.isFixed) return true;
    }
    return false;
  }

  isRelativeFixed: boolean = false;

  get isExcludedComponent() {
    return this.isFixed || this.isRelativeFixed;
  }

  parent: Component = this;

  unionFindTreeParent: Component = this;

  unionFindTreeConstraints: Constraint[] = [];

  getGroupedConstraints() {
    if (!this.isRoot) throw new Error('ルートコンポーネントじゃない');
    return this.unionFindTreeConstraints;
  }

  get root(): Component {
    if (this.unionFindTreeParent === this) return this;
    // 経路圧縮
    return this.unionFindTreeParent.root;
  }

  get isRoot() {
    return this.root === this;
  }

  unite(other: Component, constraint: Constraint) {
    if (this.root === other.root) return;
    const otherRoot = other.root;
    other.root.unionFindTreeParent = this.root;
    this.root.unionFindTreeConstraints = [
      ...this.root.unionFindTreeConstraints,
      constraint,
      ...otherRoot.unionFindTreeConstraints
    ];
    otherRoot.unionFindTreeConstraints = [];
  }

  constructor(element: IElement) {
    this.name = element.name.value;
    this.element = element;
    this._position = element.position.value;
    this._quaternion = element.rotation.value;
    this.localVectors = element.getPoints().map((p) => p.value);
    this._isFixed = isFixedElement(element); // fixedElementになった場合、ソルバに評価されない
  }
}

export interface Restorer {
  restore(): void;
}

export class BarRestorer implements Restorer {
  element: IBar;

  fixedPoint: INamedVector3;

  point: INamedVector3;

  constructor(element: IBar, fixedPoint: INamedVector3, point: INamedVector3) {
    this.element = element;
    this.fixedPoint = fixedPoint;
    this.point = point;
  }

  restore() {
    const fp = this.element.fixedPoint.value;
    const fpParent = this.fixedPoint.parent as IElement;
    const pParent = this.point.parent as IElement;
    const fpTo = this.fixedPoint.value
      .applyQuaternion(fpParent.rotation.value)
      .add(fpParent.position.value);
    const s = this.element.point.value.sub(fp).normalize();

    const pTo = this.point.value
      .applyQuaternion(pParent.rotation.value)
      .add(pParent.position.value);
    const sTo = pTo.sub(fpTo).normalize();
    this.element.rotation.value = new Quaternion().setFromUnitVectors(s, sTo);

    fp.applyQuaternion(this.element.rotation.value);
    const deltaP = fpTo.clone().sub(fp);
    this.element.position.value = this.element.position.value.add(deltaP);
  }
}

export class AArmRestorer implements Restorer {
  element: IAArm;

  fixedPoints: [INamedVector3, INamedVector3];

  point: INamedVector3;

  constructor(
    element: IAArm,
    fixedPoints: [INamedVector3, INamedVector3],
    point: INamedVector3
  ) {
    this.element = element;
    this.fixedPoints = fixedPoints;
    this.point = point;
  }

  restore() {}
}

export class TireRestorer implements Restorer {
  element: ITire;

  leftBearing: INamedVector3;

  rightBearing: INamedVector3;

  constructor(
    element: ITire,
    leftBearing: INamedVector3,
    rightBearing: INamedVector3
  ) {
    this.element = element;
    this.leftBearing = leftBearing;
    this.rightBearing = rightBearing;
  }

  restore() {
    const fp = this.element.leftBearing.value;
    const fpTo = this.leftBearing.value;
    const deltaP = fpTo.clone().sub(fp);
    const s = this.element.rightBearing.value.sub(fp).normalize();
    const sTo = this.rightBearing.value.sub(fpTo).normalize();
    this.element.rotation.value = new Quaternion().setFromUnitVectors(s, sTo);
    this.element.position.value = this.element.position.value.add(deltaP);
  }
}

export class RelativeConstraintRestorer implements Restorer {
  constrained: IElement;

  componentElement: IElement;

  deltaPosition: Vector3;

  deltaQuaternion: Quaternion;

  constructor(
    constrained: IElement,
    componentElement: IElement,
    joints: JointAsVector3[]
  ) {
    this.constrained = constrained;
    this.componentElement = componentElement;
    this.deltaPosition = new Vector3();
    this.deltaQuaternion = new Quaternion();
    throw new Error('未実装');
  }

  restore() {}
}

export class KinematicSolver {
  assembly: IAssembly;

  components: Component[][];

  equations: number[];

  degreeOfFreedoms: number[];

  restorers: Restorer[] = [];

  constructor(assembly: IAssembly) {
    this.assembly = assembly;
    const {children} = assembly;
    const joints = assembly.getJointsAsVector3();
    const jointDict = getJointDictionary(children, joints);
    const constraints: Constraint[] = [];
    const components: Component[] = [];
    const jointsDone = new Set<JointAsVector3>();
    const tempComponents: {[index: string]: Component} = {};
    const tempElements: {[index: string]: IElement} = {};
    // ステップ1: ChildrenをComponentに変換する
    {
      children.forEach((element) => {
        // 拘束コンポーネントは除外する
        if (isSimplifiedElement(element)) return;
        /* 固定コンポーネントはソルバから除外していたが、
         除外しないで、あとから判定させる。
      if (isFixedElement(element)) return;
      */
        tempComponents[element.nodeID] = new Component(element);
        tempElements[element.nodeID] = element;
      });
    }
    // ステップ2: 3点以上の拘束式で拘束されているElementを統合し、相対固定拘束を作成
    // また、相対固定拘束であるというフラグを立てる
    // 計算された相対固定拘束のデルタだけ、ComponentのlocalPointsを移動する
    {
      const needToUpdatePoints = new Map<Component, [Vector3, Quaternion]>();
      children.forEach((element) => {
        // AArmが単独で使われている場合は、BarAndSpheres2つに変更する。
        if (isAArm(element) && canSimplifyAArm(element, jointDict)) return;
        // BarはComponent扱いしない
        if (isBar(element) || isSpringDumper(element)) return;
        // Tireはコンポーネント扱いしない
        if (isTire(element)) return;
        // FixedElementはコンポーネント扱いしない
        if (isFixedElement(element)) return;
        // 関連するジョイントを得る(すでに検討済みであれば破棄)
        const [partnerIDs, jDict] = getJointsToOtherComponents(
          jointDict[element.nodeID].filter((joint) => !jointsDone.has(joint)),
          element.nodeID
        );
        // 最も拘束式の多いもの(=先頭キーの大きさが3を超えていれば)
        if (partnerIDs.length) {
          const partnerID = partnerIDs[0];
          const joints = jDict[partnerID];
          if (joints.length >= 3) {
            // この2つのコンポーネントは相対固定拘束
            joints.forEach((joint) => jointsDone.add(joint));
            const component = tempComponents[element.nodeID];
            const otherComponent = tempComponents[partnerID];
            const otherElement = tempElements[partnerID];
            // 相対固定拘束を計算
            const restorer = new RelativeConstraintRestorer(
              element,
              otherElement,
              joints
            );
            this.restorers.push(restorer);
            component.parent = otherComponent;
            component.isRelativeFixed = true;
            needToUpdatePoints.set(component, [
              restorer.deltaPosition,
              restorer.deltaQuaternion
            ]);
          }
        }
      });
      // eslint-disable-next-line no-restricted-syntax
      for (const [component, [deltaP, deltaQ]] of needToUpdatePoints) {
        component.localVectors.forEach((v) =>
          v.applyQuaternion(deltaQ).add(deltaP)
        );
        while (component.parent.isRelativeFixed) {
          component.parent = component.parent.parent;
          const [deltaP, deltaQ] = needToUpdatePoints.get(component.parent)!;
          component.localVectors.forEach((v) =>
            v.applyQuaternion(deltaQ).add(deltaP)
          );
        }
      }
    }
    // ステップ3: この時点でElement間の拘束点は2点以下なので、Sphere拘束か
    // Hinge拘束か、BarAndSpher拘束を実施する。
    // この時点でコンポーネント間の拘束はただ1つの拘束式になっている。
    {
      children.forEach((element) => {
        // AArmが単独で使われている場合は、BarAndSpheres2つに変更する。
        if (isAArm(element) && canSimplifyAArm(element, jointDict)) {
          const joints = element.fixedPoints.map((p) => {
            const joint = jointDict[p.nodeID][0];
            jointsDone.add(joint);
            return joint;
          });
          const jointu = jointDict[element.points[0].nodeID][0];
          jointsDone.add(jointu);
          const ptsBody = joints.map((joint, i) =>
            getJointPartner(joint, element.fixedPoints[i].nodeID)
          );
          const pUpright = getJointPartner(jointu, element.points[0].nodeID);
          const body = ptsBody[0].parent as IElement;
          const upright = pUpright.parent as IElement;
          this.restorers.push(
            new AArmRestorer(element, [ptsBody[0], ptsBody[1]], pUpright)
          );
          // あまりないと思うが、AArmのすべての点が同じコンポーネントに接続されている場合無視する
          if (
            body.nodeID === upright.nodeID ||
            (isFixedElement(body) && isFixedElement(upright))
          ) {
            return;
          }
          const pointsBody = body.getPoints();
          const pointsUpright = upright.getPoints();
          ptsBody.forEach((pBody, i) => {
            const constraint = new BarAndSpheres(
              `bar object of aarm ${element.name.value}`,
              tempComponents[body.nodeID],
              tempComponents[upright.nodeID],
              pointsBody.findIndex((p) => pBody.nodeID === p.nodeID),
              pointsUpright.findIndex((p) => pUpright.nodeID === p.nodeID),
              element.points[0].value.sub(element.fixedPoints[i].value).length()
            );
            constraints.push(constraint);
          });
          return;
        }
        // BarはComponent扱いしない
        if (isBar(element) || isSpringDumper(element)) {
          const jointf = jointDict[element.fixedPoint.nodeID][0];
          const jointp = jointDict[element.point.nodeID][0];
          jointsDone.add(jointf);
          jointsDone.add(jointp);
          const points = [
            getJointPartner(jointf, element.fixedPoint.nodeID),
            getJointPartner(jointp, element.point.nodeID)
          ];
          const elements = points.map((p) => p.parent as IElement);
          this.restorers.push(new BarRestorer(element, points[0], points[1]));
          // あまりないと思うが、AArmのすべての点が同じコンポーネントに接続されている場合無視する
          if (
            elements[0].nodeID === elements[1].nodeID ||
            (isFixedElement(elements[0]) && isFixedElement(elements[1]))
          ) {
            return;
          }
          const pointsElement = elements.map((element) => element.getPoints());
          const constraint = new BarAndSpheres(
            `bar object of ${element.name.value}`,
            tempComponents[elements[0].nodeID],
            tempComponents[elements[1].nodeID],
            pointsElement[0].findIndex((p) => points[0].nodeID === p.nodeID),
            pointsElement[1].findIndex((p) => points[1].nodeID === p.nodeID),
            element.length
          );
          constraints.push(constraint);
          return;
        }
        // Tireはコンポーネント扱いしない
        if (isTire(element)) {
          const jointr = jointDict[element.rightBearing.nodeID][0];
          const jointl = jointDict[element.leftBearing.nodeID][0];
          jointsDone.add(jointr);
          jointsDone.add(jointl);
          const points = [
            getJointPartner(jointr, element.rightBearing.nodeID),
            getJointPartner(jointl, element.leftBearing.nodeID)
          ];
          const elements = points.map((p) => p.parent as IElement);
          this.restorers.push(new TireRestorer(element, points[0], points[1]));
          // Tireの両端が同じコンポーネントに接続されている場合(通常の状態)であればタイヤは無視する。
          if (
            elements[0].nodeID === elements[1].nodeID ||
            (isFixedElement(elements[0]) && isFixedElement(elements[1]))
          ) {
            return;
          }
          // 以下はかなり特殊な場合（BRGの剛性を再現しているとか）
          const pointsElement = elements.map((element) => element.getPoints());
          const constraint = new BarAndSpheres(
            `bar object of tire ${element.name.value}`,
            tempComponents[elements[0].nodeID],
            tempComponents[elements[1].nodeID],
            pointsElement[0].findIndex((p) => points[0].nodeID === p.nodeID),
            pointsElement[1].findIndex((p) => points[1].nodeID === p.nodeID),
            element.bearingDistance
          );
          constraints.push(constraint);
        }
      });
      children.forEach((element) => {
        // AArmが単独で使われている場合は、BarAndSpheres2つに変更する。
        if (isAArm(element) && canSimplifyAArm(element, jointDict)) return;
        // BarはComponent扱いしない
        if (isBar(element) || isSpringDumper(element)) return;
        // Tireはコンポーネント扱いしない
        if (isTire(element)) return;
        // FixedElementはコンポーネント扱いしない
        if (isFixedElement(element)) return;
        // 相対固定拘束の場合は、親のみを追加
        const component = tempComponents[element.nodeID];
        if (component.isRelativeFixed) return;
        // solverにコンポーネントを追加する
        components.push(component);
        // 関連するジョイントを得る(すでに検討済みであれば破棄)
        const [partnerIDs, jDict] = getJointsToOtherComponents(
          jointDict[element.nodeID].filter((joint) => !jointsDone.has(joint)),
          element.nodeID
        );
        // 拘束の多い順に拘束式を作成
        partnerIDs.forEach((partnerID) => {
          const otherComponent = tempComponents[partnerID];
          const otherElement = tempElements[partnerID];
          const joints = jDict[partnerID];
          const iLhs: number[] = [];
          const iRhs: number[] = [];
          let constraint: Constraint;
          joints.forEach((joint) => {
            jointsDone.add(joint);
            const [pThis, pPartner] = getNamedVector3FromJoint(
              joint,
              element.nodeID,
              partnerID
            );
            iLhs.push(getIndexOfPoint(element, pThis));
            iRhs.push(getIndexOfPoint(otherElement, pPartner));
          });
          // コンポーネント間の拘束の数は2以下
          if (joints.length === 2) {
            constraint = new Hinge(
              `Hinge Constrains to ${element.name.value} and ${otherElement.name.value}`,
              component,
              otherComponent,
              [iLhs[0], iLhs[1]],
              [iRhs[0], iRhs[1]]
            );
          } else {
            // 1点拘束
            constraint = new Sphere(
              `Sphere Constrains to ${element.name.value} and ${otherElement.name.value}`,
              component,
              otherComponent,
              iLhs[0],
              iRhs[0]
            );
          }
          constraints.push(constraint);
        });
      });
    }
    // ステップ4: グルーピング
    // Union Find Treeを用いてグルーピングを実施する。
    {
      constraints.forEach((constraint) => {
        if (constraint.lhs.isFixed && constraint.rhs.isFixed) return;
        if (constraint.lhs.isFixed) {
          constraint.rhs.root.unionFindTreeConstraints.push(constraint);
          return;
        }
        if (constraint.rhs.isFixed) {
          constraint.lhs.root.unionFindTreeConstraints.push(constraint);
          return;
        }

        constraint.lhs.unite(constraint.rhs, constraint);
      });
      const rootComponents = components.filter((component) => component.isRoot);
      this.equations = [];
      this.degreeOfFreedoms = [];
      this.components = rootComponents.map((root) => {
        const grouped = [
          root,
          ...components.filter(
            (component) => component.root === root && component !== root
          )
        ];
        grouped.forEach((component) => {
          const constraintToNormalize = component.getConstraintToNormalize();
          if (constraintToNormalize) {
            root.unionFindTreeConstraints.push(constraintToNormalize);
          }
        });
        this.equations.push(
          root.unionFindTreeConstraints.reduce((prev, current) => {
            current.row = prev;
            return prev + current.constraints;
          }, 0)
        );
        this.degreeOfFreedoms.push(
          grouped.reduce((prev, current) => {
            current.setCol(prev);
            return prev + current.degreeOfFreedom;
          }, 0)
        );
        return grouped;
      });
    }
    // 上記4ステップでプリプロセッサ完了
    this.solve({postProcess: true});
  }

  solve(params: {maxCnt?: number; postProcess?: boolean}): void {
    const start = performance.now();
    const {maxCnt} = params;
    const postProcess = params.postProcess ?? true;

    // Kinematicソルバを解く
    this.components.forEach((components, idx) => {
      const root = components[0];
      const constraints = root.getGroupedConstraints();
      const equations = this.equations[idx];
      const degreeOfFreedom = this.degreeOfFreedoms[idx];

      let i = 0;
      let minNorm = Number.MAX_SAFE_INTEGER;
      let eq = false;
      while (!eq && ++i < (maxCnt ?? 100)) {
        const phi_q = new Matrix(equations, degreeOfFreedom);
        const phi = new Array<number>(degreeOfFreedom);
        constraints.forEach((constraint) => {
          constraint.setJacobianAndConstraints(phi_q, phi);
        });

        const matPhi = new Matrix([phi]).transpose();
        const dq = new SingularValueDecomposition(phi_q, {
          autoTranspose: true
        }).solve(matPhi);

        // 差分を反映
        components.forEach((component) => component.applyDq(dq));

        // const l2 = dq.transpose().mmul(dq);
        // const norm = l2.get(0, 0);
        const norm = dq.norm('frobenius');
        eq = norm < 1.0e-3;
        if (norm > minNorm * 100 || Number.isNaN(norm)) {
          // eslint-disable-next-line no-console
          console.log(`norm=${norm}`);
          // eslint-disable-next-line no-console
          console.log('収束していない');
          throw new Error('ニュートンラプソン法収束エラー');
        }
        if (norm < minNorm) {
          minNorm = norm;
        }
      }
    });

    const end = performance.now();
    // eslint-disable-next-line no-console
    console.log(`solver converged. time = ${end - start}`);

    if (postProcess) {
      this.postProcess();
    }
  }

  // ポストプロセス： 要素への位置の反映と、Restorerの適用
  postProcess(): void {
    // Componentの位置、回転をElementに反映
    this.components.forEach((components) =>
      components.forEach((component) => component.applyResultToElement())
    );
    // 簡略化したElementを反映する
    this.restorers.forEach((restorer) => {
      restorer.restore();
    });
  }
}
