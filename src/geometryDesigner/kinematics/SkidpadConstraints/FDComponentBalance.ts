/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {Matrix} from 'ml-matrix';
import {Vector3, Quaternion} from 'three';
import {IElement} from '@gd/IElements';
import {
  skew,
  rotationMatrix,
  decompositionMatrixG,
  getDeltaOmega,
  // deltaXcross,
  getVVector
} from '../KinematicFunctions';
import {
  IComponent,
  IVariable,
  FullDegreesComponent,
  PointForce,
  GeneralVariable
} from '../KinematicComponents';
import {Constraint} from '../Constraints';
import {Balance} from '../SkidpadConstraints';
import {TireBalance} from './TireBalance';

const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;

const unitZ = getVVector(new Vector3(0, 0, 1));
const unitZT = unitZ.transpose();

export class FDComponentBalance implements Constraint, Balance {
  readonly className = 'FDComponentBalance';

  // 並進運動+回転
  constraints() {
    return 6;
  }

  active() {
    return true;
  }

  resetStates(): void {}

  readonly isInequalityConstraint = false;

  row: number = -1;

  relevantVariables: IVariable[];

  name: string;

  element: IElement;

  component: IComponent;

  pfs: PointForce[];

  cogLocalVec: Vector3;

  cogLocalSkew: Matrix;

  pointLocalVec: Vector3[];

  pointLocalSkew: Matrix[];

  g: Vector3;

  mass: number;

  vO: () => Vector3;

  omega: GeneralVariable;

  pfCoefs: number[]; // ジョイント部分のローカルベクトルのノードID 作用反作用で定義

  conectedTireBalance: TireBalance[];

  constructor(params: {
    name: string;
    component: FullDegreesComponent;
    element: IElement;
    mass: number;
    cog: Vector3;
    points: Vector3[];
    pointForceComponents: PointForce[];
    pfsPointNodeIDs: string[]; // ジョイント部分のローカルベクトルのノードID 作用反作用どちらで使うかを判定する
    vO: () => Vector3; // 座標原点の速度
    omega: GeneralVariable;
    connectedTireBalance: TireBalance[];
  }) {
    this.name = params.name;
    this.element = params.element;
    this.component = params.component;
    this.mass = params.mass;
    this.vO = params.vO;
    this.omega = params.omega;
    this.g = new Vector3(0, 0, -9810 * this.component.scale);
    this.pfs = [...params.pointForceComponents];

    this.pfCoefs = this.pfs.map((pf, i) => pf.sign(params.pfsPointNodeIDs[i]));

    this.conectedTireBalance = params.connectedTireBalance;

    this.relevantVariables = [this.component, this.omega, ...this.pfs];

    this.cogLocalVec = params.cog.clone().multiplyScalar(this.component.scale);
    this.cogLocalSkew = skew(this.cogLocalVec).mul(-2);

    this.pointLocalVec = params.points.map((p) =>
      p.clone().multiplyScalar(this.component.scale)
    );
    this.pointLocalSkew = this.pointLocalVec.map((p) => skew(p).mul(-2));
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {
      row,
      component,
      pfs,
      pfCoefs,
      cogLocalVec,
      cogLocalSkew,
      pointLocalVec,
      pointLocalSkew,
      g
    } = this;

    // 車両座標系そのものの角速度と速度と遠心力
    const omega = new Vector3(0, 0, this.omega.value); // 角速度
    const omegaSkew = skew(omega); // 角速度のSkewMatrix
    const omegaSkew2 = omegaSkew.mmul(omegaSkew); // 角速度のSkewMatrix
    const vO = this.vO(); // 車速
    const cO = omega.clone().cross(vO).multiplyScalar(-1); // 車両座標系にかかる原点の遠心力
    const q = component.quaternion; // 注目している部品の姿勢

    const pQ = pointLocalVec.map((p) => p.clone().applyQuaternion(q));
    const pSkewQ = pQ.map((p) => skew(p));

    // 部品の部品座標系での重心
    const cogQ = cogLocalVec.clone().applyQuaternion(q);
    const pCog = cogQ.clone().add(component.position);
    const cogSkewQ = skew(cogQ);
    const cogSkewP = skew(pCog);
    // 部品にかかる遠心力
    const c = omega
      .clone()
      .cross(omega.clone().cross(pCog))
      .multiplyScalar(-1)
      .add(cO);
    const ma = g.clone().add(c).multiplyScalar(this.mass); // 遠心力＋重力
    const maSkew = skew(ma);

    // タイヤが接続されていればその駆動力の反モーメントを受け取る
    const driveMomentAndDiffs = this.conectedTireBalance.map((tb) =>
      tb.getDriveMoment()
    );

    // 力のつり合い
    const translation = pfs
      .reduce((prev, current, i) => {
        const f = current.force.clone().multiplyScalar(pfCoefs[i]);
        prev.add(f);
        return prev;
      }, new Vector3())
      .add(ma);

    // モーメントつり合い
    // 変分の方程式がわかりやすくなるようにあえて、力x距離にする
    const rotation = pfs
      .reduce((prev, current, i) => {
        const f = current.force.clone().multiplyScalar(pfCoefs[i]).cross(pQ[i]);
        prev.add(f);
        return prev;
      }, new Vector3())
      .add(ma.clone().cross(cogQ));
    /* driveMomentAndDiffs.forEach((dm) => {
      rotation.sub(dm.mX);
    }); */

    // 方程式のつり合い
    phi[row + X] = translation.x;
    phi[row + Y] = translation.y;
    phi[row + Z] = translation.z;
    phi[row + X + 3] = rotation.x;
    phi[row + Y + 3] = rotation.y;
    phi[row + Z + 3] = rotation.z;

    const {col} = component;

    // ヤコビアンの導出
    const A = rotationMatrix(q);
    const G = decompositionMatrixG(q);
    const colOmega = this.omega.col;
    // 力のつり合いのヤコビアン

    // df
    const df = Matrix.eye(3, 3);
    pfs.forEach((pf, i) => {
      phi_q.subMatrixAdd(df.clone().mul(pfCoefs[i]), row + X, pf.col + X);
    });

    // dP
    const dP = omegaSkew2.clone().mul(-this.mass);
    phi_q.subMatrixAdd(dP, row, col + X);

    // dQ
    const dTheta1 = omegaSkew2.mmul(A).mmul(cogLocalSkew).mul(-this.mass);
    phi_q.subMatrixAdd(dTheta1.mmul(G), row, col + Q0);

    // dω
    const dOmega1 = getDeltaOmega(
      vO,
      omega,
      omegaSkew,
      pCog,
      cogSkewP,
      this.mass
    ).mmul(unitZ); // (3x1)
    phi_q.subMatrixAdd(dOmega1, row, colOmega);

    // モーメントの部分のヤコビアン
    // dF
    pfs.forEach((pf, i) => {
      const dpf = pSkewQ[i].clone().mul(-pfCoefs[i]);
      phi_q.subMatrixAdd(dpf, row + 3, pf.col + X);
    });

    // dP
    const dPRot = cogSkewQ.mmul(dP).mul(-1);
    phi_q.subMatrixAdd(dPRot, row + 3, col + X);

    // dQ
    const dTheta2 = new Matrix(3, 3);
    pfs.forEach((pf, i) => {
      // theta部分の微分
      const dThetabyF = skew(pf.force.clone())
        .mmul(A)
        .mmul(pointLocalSkew[i])
        .mul(pfCoefs[i]);
      dTheta2.add(dThetabyF);
    });
    dTheta2.add(maSkew.mmul(A).mmul(cogLocalSkew));
    dTheta2.add(cogSkewQ.mmul(dTheta1).mul(-1));
    phi_q.subMatrixAdd(dTheta2.mmul(G), row + 3, col + Q0);

    // dω
    const dOmega2 = cogSkewQ.mmul(dOmega1).mul(-1);
    phi_q.subMatrixAdd(dOmega2, row + 3, colOmega);

    /* driveMomentAndDiffs.forEach((dm) => {
      const {
        dMX_dOmega,
        dMX_de,
        dMX_df,
        dMX_dP,
        dMX_dQ,
        pfsCols,
        targetComponentCol,
        targetErrorCol
      } = dm;
      pfsCols.forEach((col, i) => {
        phi_q.subMatrixSub(dMX_df[i], row + 3, col + X);
      });
      phi_q.subMatrixSub(dMX_dP, row + 3, targetComponentCol + X);
      phi_q.subMatrixSub(dMX_dQ, row + 3, targetComponentCol + Q0);
      phi_q.subMatrixSub(dMX_de, row + 3, targetErrorCol);
      phi_q.subMatrixSub(dMX_dOmega, row + 3, this.omega.col);
    }); */
  }

  applytoElement() {}

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}
