/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {Matrix} from 'ml-matrix';
import {
  IElement,
  IAssembly,
  isAArm,
  isBar,
  isTire,
  isSpringDumper,
  isSimplifiedElement,
  isBodyOfFrame,
  IAArm,
  IBar,
  ITire
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
  getAssemblyMode,
  isFixedElement
} from './KinematicFunctions';

const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;
const Q1 = 4;
const Q2 = 5;
const Q3 = 6;

export interface Constrain {
  constrains: number;
  readonly name: string;
  setJacobianAndConstrains(phi_q: Matrix, phi: number[]): void;
}

export class Sphere implements Constrain {
  constrains = 3; // 自由度を3減らす

  row: number;

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
    row: number,
    lhs: Component,
    rhs: Component,
    ilhs: number,
    irhs: number
  ) {
    this.name = name;
    this.row = row;
    if (lhs.isFixed) {
      if (rhs.isFixed) throw new Error('拘束式の両端が固定されている');
      // 固定側はrhsにする
      this.lhs = rhs;
      this.rhs = lhs;
      const tmp = ilhs;
      ilhs = irhs;
      irhs = tmp;
    } else {
      this.lhs = lhs;
      this.rhs = rhs;
    }

    this.lLocalVec = lhs.localVectors[ilhs].clone();
    this.lLocalSkew = skew(this.lLocalVec).mul(2);
    this.rLocalVec = rhs.localVectors[irhs].clone();
    this.rLocalSkew = skew(this.rLocalVec).mul(-2);
    if (rhs.isFixed) {
      this.isFixed = true;
      this.target = rhs.position.add(
        this.rLocalVec.applyQuaternion(rhs.quaternion)
      );
    }
  }

  setJacobianAndConstrains(phi_q: Matrix, phi: number[]) {
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
      const constrain = lhs.position
        .clone()
        .add(sLhs)
        .sub(rhs.position)
        .sub(sRhs);
      phi[row + X] = constrain.x;
      phi[row + Y] = constrain.y;
      phi[row + Z] = constrain.z;
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
      const constrain = lhs.position.clone().add(sLhs).sub(this.target);
      phi[row + X] = constrain.x;
      phi[row + Y] = constrain.y;
      phi[row + Z] = constrain.z;
      // diff of positions are 1
      phi_q.set(row + X, cLhs + X, 1);
      phi_q.set(row + Y, cLhs + Y, 1);
      phi_q.set(row + Z, cLhs + Z, 1);
      setSubMatrix(row + X, cLhs + Q0, phi_q, ALhs.mmul(lLocalSkew).mmul(GLhs));
    }
  }
}

export class Hinge implements Constrain {
  constrains = 5; // 自由度を5減らす

  row: number;

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
    row: number,
    lhs: Component,
    rhs: Component,
    ilhs: [number, number],
    irhs: [number, number]
  ) {
    this.name = name;
    this.row = row;
    if (rhs.isFixed) {
      if (lhs.isFixed) throw new Error('拘束式の両端が固定されている');
      // 固定側はlhsにする
      this.lhs = rhs;
      this.rhs = lhs;
      const tmp = ilhs;
      ilhs = irhs;
      irhs = tmp;
    } else {
      this.lhs = lhs;
      this.rhs = rhs;
    }
    this.lLocalVec = lhs.localVectors[ilhs[0]].clone();
    this.lLocalSkew = skew(this.lLocalVec).mul(2);
    this.rLocalVec = rhs.localVectors[irhs[0]].clone();
    this.rLocalSkew = skew(this.rLocalVec).mul(-2);
    this.rAxisVec = rhs.localVectors[irhs[1]].clone().sub(this.rLocalVec);
    this.rAxisSkew = skew(this.rAxisVec).mul(2);
    const lAxisVec = lhs.localVectors[ilhs[1]].clone().sub(this.lLocalVec);
    if (
      this.rAxisVec.lengthSq() < Number.EPSILON ||
      lAxisVec.lengthSq() < Number.EPSILON
    ) {
      throw new Error('ヒンジを構成する2点が近すぎます');
    }
    const oVec1 = getStableOrthogonalVector(lAxisVec);
    const oVec2 = lAxisVec.cross(oVec1);
    if (lhs.isFixed) {
      this.isFixed = true;
      this.target = lhs.position.add(
        this.lLocalVec.applyQuaternion(lhs.quaternion)
      );
      oVec1.applyQuaternion(lhs.quaternion);
      oVec2.applyQuaternion(lhs.quaternion);
    }
    this.lOrthogonalVec = [oVec1, oVec2];
    this.lOrthogonalSkew = [
      skew(this.lOrthogonalVec[0]).mul(2),
      skew(this.lOrthogonalVec[1]).mul(2)
    ];
  }

  setJacobianAndConstrains(phi_q: Matrix, phi: number[]) {
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
      const constrain = lhs.position
        .clone()
        .add(sLhs)
        .sub(rhs.position)
        .sub(sRhs);
      phi[row + X] = constrain.x;
      phi[row + Y] = constrain.y;
      phi[row + Z] = constrain.z;
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
      const constrain = this.target.clone().sub(rhs.position).sub(sRhs);
      phi[row + X] = constrain.x;
      phi[row + Y] = constrain.y;
      phi[row + Z] = constrain.z;
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

export class BarAndSpheres implements Constrain {
  constrains = 1; // 自由度を1減らす

  row: number;

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
    row: number,
    lhs: Component,
    rhs: Component,
    ilhs: number,
    irhs: number,
    l: number
  ) {
    this.name = name;
    this.row = row;
    if (lhs.isFixed) {
      if (rhs.isFixed) throw new Error('拘束式の両端が固定されている');
      // 固定側はrhsにする
      this.lhs = rhs;
      this.rhs = lhs;
      const tmp = ilhs;
      ilhs = irhs;
      irhs = tmp;
    } else {
      this.lhs = lhs;
      this.rhs = rhs;
    }
    this.lLocalVec = lhs.localVectors[ilhs].clone();
    this.lLocalSkew = skew(this.lLocalVec).mul(2);
    this.rLocalVec = rhs.localVectors[irhs].clone();
    this.rLocalSkew = skew(this.rLocalVec).mul(-2);
    if (rhs.isFixed) {
      this.isFixed = true;
      this.target = rhs.position.add(
        this.rLocalVec.applyQuaternion(rhs.quaternion)
      );
    }
    this.l2 = l * l;
  }

  setJacobianAndConstrains(phi_q: Matrix, phi: number[]) {
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
      setSubMatrix(row, cRhs + X, phi_q, dT.mul(-1));
      setSubMatrix(
        row,
        cLhs + Q0,
        phi_q,
        dT.mul(ALhs).mul(lLocalSkew).mul(GLhs)
      );
      setSubMatrix(
        row,
        cRhs + Q0,
        phi_q,
        dT.mul(ARhs).mul(rLocalSkew).mul(GRhs)
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
        dT.mul(ALhs).mul(lLocalSkew).mul(GLhs)
      );
    }
  }
}

// elementの初期状態を取得し、計算後に反映する。
// ただし、Bar, Tire, SpringDumperなど自由度の小さいElementは含まれない
export class Component {
  // ヤコビアンの列番号
  col: number;

  element: IElement;

  position: Vector3;

  quaternion: Quaternion;

  localVectors: Vector3[];

  isFixed: boolean;

  constructor(element: IElement, col: number) {
    this.col = col;
    this.element = element;
    this.position = element.position.value;
    this.quaternion = element.rotation.value;
    this.localVectors = element.getPoints().map((p) => p.value);
    this.isFixed = isFixedElement(element); // fixedElementになった場合、ソルバに評価されない
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

  restore() {}
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

  fixedPoint: INamedVector3;

  point: INamedVector3;

  constructor(element: ITire, fixedPoint: INamedVector3, point: INamedVector3) {
    this.element = element;
    this.fixedPoint = fixedPoint;
    this.point = point;
  }

  restore() {}
}

export class KinematicSolver {
  assembly: IAssembly;

  components: Component[];

  constrains: Constrain[];

  restorer: Restorer[];

  equations: number;

  columnComponents: number;

  constructor(assembly: IAssembly) {
    this.assembly = assembly;
    const {children} = assembly;
    const joints = assembly.getJointsAsVector3();
    const jointDict = getJointDictionary(children, joints);
    this.components = [];
    this.constrains = [];
    this.restorer = [];
    const {constrains, components} = this;
    this.equations = 0;
    this.columnComponents = 0;
    const tempComponents: {[index: string]: Component} = {};
    const assemblyMode = getAssemblyMode();
    children.forEach((element) => {
      // 拘束コンポーネントは除外する
      if (isSimplifiedElement(element)) return;
      /* 固定コンポーネントはソルバから除外していたが、
         除外しないで、あとから判定させる。
      if (isFixedElement(element)) return;
      */
      tempComponents[element.nodeID] = new Component(element, 0);
    });
    // ChildrenをComponentに変換する
    children.forEach((element) => {
      // AArmが単独で使われている場合は、BarAndSpheres2つに変更する。
      if (isAArm(element) && canSimplifyAArm(element, jointDict)) {
        const joints = element.fixedPoints.map((p) => jointDict[p.nodeID][0]);
        const jointu = jointDict[element.points[0].nodeID][0];
        const ptsBody = joints.map((joint, i) =>
          getJointPartner(joint, element.fixedPoints[i].nodeID)
        );
        const pUpright = getJointPartner(jointu, element.points[0].nodeID);
        const body = ptsBody[0].parent as IElement;
        const upright = pUpright.parent as IElement;
        this.restorer.push(
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
          const constrain = new BarAndSpheres(
            `bar object of aarm ${element.name.value}`,
            this.equations,
            tempComponents[body.nodeID],
            tempComponents[upright.nodeID],
            pointsBody.findIndex((p) => pBody.nodeID === p.nodeID),
            pointsUpright.findIndex((p) => pUpright.nodeID === p.nodeID),
            element.points[0].value.sub(element.fixedPoints[i].value).length()
          );
          this.equations += constrain.constrains;
          this.constrains.push(constrain);
        });
        return;
      }
      // BarはComponent扱いしない
      if (isBar(element) || isSpringDumper(element)) {
        const jointf = jointDict[element.fixedPoint.nodeID][0];
        const jointp = jointDict[element.point.nodeID][0];
        const points = [
          getJointPartner(jointf, element.fixedPoint.nodeID),
          getJointPartner(jointp, element.point.nodeID)
        ];
        const elements = points.map((p) => p.parent as IElement);
        this.restorer.push(new BarRestorer(element, points[0], points[1]));
        // あまりないと思うが、AArmのすべての点が同じコンポーネントに接続されている場合無視する
        if (
          elements[0].nodeID === elements[1].nodeID ||
          (isFixedElement(elements[0]) && isFixedElement(elements[1]))
        ) {
          return;
        }
        const pointsElement = elements.map((element) => element.getPoints());
        const constrain = new BarAndSpheres(
          `bar object of${element.name.value}`,
          this.equations,
          tempComponents[elements[0].nodeID],
          tempComponents[elements[1].nodeID],
          pointsElement[0].findIndex((p) => points[0].nodeID === p.nodeID),
          pointsElement[1].findIndex((p) => points[1].nodeID === p.nodeID),
          element.length
        );
        this.equations += constrain.constrains;
        this.constrains.push(constrain);
        return;
      }
      // Frame固定の場合はTireはコンポーネント扱いしない
      if (assemblyMode === 'FixedFrame' && isTire(element)) {
        const jointr = jointDict[element.rightBearing.nodeID][0];
        const jointl = jointDict[element.leftBearing.nodeID][0];
        const points = [
          getJointPartner(jointr, element.rightBearing.nodeID),
          getJointPartner(jointl, element.leftBearing.nodeID)
        ];
        const elements = points.map((p) => p.parent as IElement);
        this.restorer.push(new TireRestorer(element, points[0], points[1]));
        // Tireの両端が同じコンポーネントに接続されている場合(通常の状態)であればタイヤは無視する。
        if (
          elements[0].nodeID === elements[1].nodeID ||
          (isFixedElement(elements[0]) && isFixedElement(elements[1]))
        ) {
          return;
        }
        // 以下はかなり特殊な場合（BRGの剛性を再現しているとか）
        const pointsElement = elements.map((element) => element.getPoints());
        const constrain = new BarAndSpheres(
          `bar object of tire${element.name.value}`,
          this.equations,
          tempComponents[elements[0].nodeID],
          tempComponents[elements[1].nodeID],
          pointsElement[0].findIndex((p) => points[0].nodeID === p.nodeID),
          pointsElement[1].findIndex((p) => points[1].nodeID === p.nodeID),
          element.bearingDistance
        );
        this.equations += constrain.constrains;
        this.constrains.push(constrain);
        return;
      }
      // FixedElementはコンポーネント扱いしない
      if (isFixedElement(element)) return;

      // solverにコンポーネントを追加する
      const component = tempComponents[element.nodeID];
      component.col = this.columnComponents;
      this.columnComponents += 7;
      this.components.push(component);
    });
  }

  solve(): void {}

  setElements(): void {}
}
