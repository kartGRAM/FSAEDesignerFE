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
  getAssemblyMode
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

  name: string;

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
    this.lhs = lhs;
    this.rhs = rhs;
    this.lLocalVec = lhs.localVectors[ilhs].clone();
    this.lLocalSkew = skew(this.lLocalVec).mul(2);
    this.rLocalVec = rhs.localVectors[irhs].clone();
    this.rLocalSkew = skew(this.rLocalVec).mul(-2);
  }

  setJacobianAndConstrains(phi_q: Matrix, phi: number[]) {
    const cLhs = this.lhs.col;
    const cRhs = this.rhs.col;
    const {row, lhs, rhs, lLocalVec, lLocalSkew, rLocalVec, rLocalSkew} = this;
    const qLhs = lhs.quaternion;
    const qRhs = rhs.quaternion;
    const ALhs = rotationMatrix(qLhs);
    const ARhs = rotationMatrix(qRhs);
    const GLhs = decompositionMatrixG(qLhs);
    const GRhs = decompositionMatrixG(qRhs);
    const sLhs = lLocalVec.clone().applyQuaternion(qLhs);
    const sRhs = rLocalVec.clone().applyQuaternion(qRhs);

    // 始点位置拘束
    {
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
    }
  }
}

export class FixedSphere implements Constrain {
  constrains = 3; // 自由度を3減らす

  row: number;

  lhs: Component;

  lLocalVec: Vector3;

  lLocalSkew: Matrix;

  target: Vector3;

  name: string;

  constructor(
    name: string,
    row: number,
    lhs: Component,
    ilhs: number,
    target: Vector3
  ) {
    this.name = name;
    this.row = row;
    this.lhs = lhs;
    this.lLocalVec = lhs.localVectors[ilhs].clone();
    this.lLocalSkew = skew(this.lLocalVec).mul(2);
    this.target = target.clone();
  }

  setJacobianAndConstrains(phi_q: Matrix, phi: number[]) {
    const cLhs = this.lhs.col;
    const {row, lhs, lLocalVec, lLocalSkew, target} = this;
    const qLhs = lhs.quaternion;
    const ALhs = rotationMatrix(qLhs);
    const GLhs = decompositionMatrixG(qLhs);
    const sLhs = lLocalVec.clone().applyQuaternion(qLhs);

    // 始点位置拘束
    {
      const constrain = lhs.position.clone().add(sLhs).sub(target);
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

  name: string;

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
    this.lhs = lhs;
    this.rhs = rhs;
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
    this.lOrthogonalVec = [oVec1, oVec2];
    this.lOrthogonalSkew = [
      skew(this.lOrthogonalVec[0]).mul(2),
      skew(this.lOrthogonalVec[1]).mul(2)
    ];
  }

  setJacobianAndConstrains(phi_q: Matrix, phi: number[]) {
    const cLhs = this.lhs.col;
    const cRhs = this.rhs.col;
    const {
      row,
      lhs,
      rhs,
      lLocalVec,
      lLocalSkew,
      lOrthogonalVec,
      lOrthogonalSkew,
      rLocalVec,
      rLocalSkew,
      rAxisVec,
      rAxisSkew
    } = this;
    const qLhs = lhs.quaternion;
    const qRhs = rhs.quaternion;
    const ALhs = rotationMatrix(qLhs);
    const ARhs = rotationMatrix(qRhs);
    const GLhs = decompositionMatrixG(qLhs);
    const GRhs = decompositionMatrixG(qRhs);
    const sLhs = lLocalVec.clone().applyQuaternion(qLhs);
    const sRhs = rLocalVec.clone().applyQuaternion(qRhs);

    // 始点位置拘束
    {
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
    }

    // 並行拘束
    const axis = rAxisVec.clone().applyQuaternion(qRhs);
    const axisT = new Matrix([[axis.x, axis.y, axis.z]]); // (1x3)
    const axisDelta = ARhs.mmul(rAxisSkew).mmul(GRhs); // (3x4)
    for (let r = 0; r < 2; ++r) {
      const orthoVec = lOrthogonalVec[r].clone().applyQuaternion(qLhs);
      phi[r + row + 3] = orthoVec.dot(axis);
      const orthoDelta = ALhs.mmul(lOrthogonalSkew[r]).mmul(GLhs); // (3x4)
      const orthoT = new Matrix([[orthoVec.x, orthoVec.y, orthoVec.z]]); // (1x3)
      const dLhs = axisT.mmul(orthoDelta); // (1x3) x (3x4) = (1x4)
      const dRhs = orthoT.mmul(axisDelta); // (1x3) x (3x4) = (1x4)

      setSubMatrix(row + 3 + r, cLhs + Q0, phi_q, dLhs);
      setSubMatrix(row + 3 + r, cRhs + Q0, phi_q, dRhs);
    }
  }
}

export class FixedHinge implements Constrain {
  constrains = 5; // 自由度を5減らす

  row: number;

  rhs: Component;

  rLocalVec: Vector3;

  rLocalSkew: Matrix;

  rAxisVec: Vector3;

  rAxisSkew: Matrix;

  targetVec: Vector3;

  // 軸に垂直なベクトル
  targetOrthogonalVec: [Vector3, Vector3];

  name: string;

  constructor(
    name: string,
    row: number,
    rhs: Component,
    irhs: [number, number],
    target: [Vector3, Vector3]
  ) {
    this.name = name;
    this.row = row;
    this.rhs = rhs;
    this.targetVec = target[0].clone();
    this.rLocalVec = rhs.localVectors[irhs[0]].clone();
    this.rLocalSkew = skew(this.rLocalVec).mul(-2);
    this.rAxisVec = rhs.localVectors[irhs[1]].clone().sub(this.rLocalVec);
    this.rAxisSkew = skew(this.rAxisVec).mul(2);
    const targetAxisVec = target[1].clone().sub(target[0]);
    if (
      this.rAxisVec.lengthSq() < Number.EPSILON ||
      targetAxisVec.lengthSq() < Number.EPSILON
    ) {
      throw new Error('ヒンジを構成する2点が近すぎます');
    }
    const oVec1 = getStableOrthogonalVector(targetAxisVec);
    const oVec2 = targetAxisVec.cross(oVec1);
    this.targetOrthogonalVec = [oVec1, oVec2];
  }

  setJacobianAndConstrains(phi_q: Matrix, phi: number[]) {
    const cRhs = this.rhs.col;
    const {
      row,
      rhs,
      targetVec,
      targetOrthogonalVec,
      rLocalVec,
      rLocalSkew,
      rAxisVec,
      rAxisSkew
    } = this;
    const qRhs = rhs.quaternion;
    const ARhs = rotationMatrix(qRhs);
    const GRhs = decompositionMatrixG(qRhs);
    const sRhs = rLocalVec.clone().applyQuaternion(qRhs);

    // 始点位置拘束
    {
      const constrain = targetVec.clone().sub(rhs.position).sub(sRhs);
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
    const axisDelta = ARhs.mmul(rAxisSkew).mmul(GRhs); // (3x4)
    for (let r = 0; r < 2; ++r) {
      const orthoVec = targetOrthogonalVec[r].clone();
      phi[r + row + 3] = orthoVec.dot(axis);
      const orthoT = new Matrix([[orthoVec.x, orthoVec.y, orthoVec.z]]); // (1x3)
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
    this.lhs = lhs;
    this.rhs = rhs;
    this.lLocalVec = lhs.localVectors[ilhs].clone();
    this.lLocalSkew = skew(this.lLocalVec).mul(2);
    this.rLocalVec = rhs.localVectors[irhs].clone();
    this.rLocalSkew = skew(this.rLocalVec).mul(-2);
    this.l2 = l * l;
  }

  setJacobianAndConstrains(phi_q: Matrix, phi: number[]) {
    const cLhs = this.lhs.col;
    const cRhs = this.rhs.col;
    const {row, lhs, rhs, lLocalVec, lLocalSkew, rLocalVec, rLocalSkew, l2} =
      this;
    const qLhs = lhs.quaternion;
    const qRhs = rhs.quaternion;
    const ALhs = rotationMatrix(qLhs);
    const ARhs = rotationMatrix(qRhs);
    const GLhs = decompositionMatrixG(qLhs);
    const GRhs = decompositionMatrixG(qRhs);
    const sLhs = lLocalVec.clone().applyQuaternion(qLhs);
    const sRhs = rLocalVec.clone().applyQuaternion(qRhs);

    const d = lhs.position.clone().add(sLhs).sub(rhs.position).sub(sRhs);
    const dT = new Matrix([[d.x * 2, d.y * 2, d.z * 2]]); // (1x3)
    phi[row] = d.lengthSq() - l2;

    setSubMatrix(row, cLhs + X, phi_q, dT);
    setSubMatrix(row, cRhs + X, phi_q, dT.mul(-1));
    setSubMatrix(row, cLhs + Q0, phi_q, dT.mul(ALhs).mul(lLocalSkew).mul(GLhs));
    setSubMatrix(row, cRhs + Q0, phi_q, dT.mul(ARhs).mul(rLocalSkew).mul(GRhs));
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

  constructor(element: IElement, col: number) {
    this.col = col;
    this.element = element;
    this.position = element.position.value;
    this.quaternion = element.rotation.value;
    this.localVectors = element.getPoints().map((p) => p.value);
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
    const tempComponents: {[index: string]: Component} = {};
    const assemblyMode = getAssemblyMode();
    children.forEach((element) => {
      // 拘束コンポーネントは除外する
      if (isSimplifiedElement(element)) return;
      if (assemblyMode === 'FixedFrame') {
        // フレームボディはcomponentsから除外する
        if (isBodyOfFrame(element)) return;
      }
      tempComponents[element.nodeID] = new Component(element, 0);
    });
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
        // あまりないと思うが、AArmのすべての点が同じコンポーネントに接続されている場合無視する
        if (body.nodeID !== upright.nodeID) {
          const pointsBody = body.getPoints();
          const pointsUpright = upright.getPoints();
          ptsBody.forEach((pBody) => {
            const constrain = new BarAndSpheres(
              `bar object of aarm ${element.name.value}`,
              this.equations,
              tempComponents[body.nodeID],
              tempComponents[upright.nodeID],
              pointsBody.findIndex((p) => pBody.nodeID === p.nodeID),
              pointsUpright.findIndex((p) => pUpright.nodeID === p.nodeID),
              pBody.value.sub(pUpright.value).length()
            );
            this.equations += constrain.constrains;
            this.constrains.push(constrain);
          });
        }
        this.restorer.push(
          new AArmRestorer(element, [ptsBody[0], ptsBody[1]], pUpright)
        );
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
        // あまりないと思うが、Barの両端が同じコンポーネントに接続されている場合無視する
        if (elements[0].nodeID !== elements[1].nodeID) {
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
        }
        this.restorer.push(new BarRestorer(element, points[0], points[1]));
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
        // Tireの両端が同じコンポーネントに接続されている場合無視する。
        // 以下はかなり特殊な場合（BRGの剛性を再現しているとか）
        if (elements[0].nodeID !== elements[1].nodeID) {
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
        }
        this.restorer.push(new TireRestorer(element, points[0], points[1]));
        return;
      }
      const a = 0;
    });
  }

  solve(): void {}

  setElements(): void {}
}
