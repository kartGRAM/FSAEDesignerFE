/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {Matrix} from 'ml-matrix';
import {Vector3, Quaternion} from 'three';
import {IElement} from '@gd/IElements';
import {Constraint, ConstraintsOptions} from '@gd/kinematics/IConstraint';
import {IScalar} from '@computationGraph/IScalar';
import {IVector3} from '@computationGraph/IVector3';
import {VariableVector3} from '@computationGraph/VariableVector3';
import {VariableScalar} from '@computationGraph/VariableScalar';
import {ConstantVector3} from '@computationGraph/Vector3';
import {VariableQuaternion} from '@computationGraph/VariableQuaternion';
import {ConstantScalar} from '@computationGraph/ConstantScalar';
import {TireBalance} from './TireBalance';
import {Balance} from '../SkidpadConstraints';
import {
  IComponent,
  IVariable,
  FullDegreesComponent,
  PointForce,
  GeneralVariable
} from '../KinematicComponents';
import {
  skew,
  rotationMatrix,
  decompositionMatrixG,
  getDeltaOmega,
  // deltaXcross,
  getVVector
} from '../KinematicFunctions';

const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;

const normal = new ConstantVector3(new Vector3(0, 0, 1));

export class FDComponentBalance implements Constraint, Balance {
  readonly className = 'FDComponentBalance';

  isBalance: true = true;

  // 並進運動+回転
  constraints() {
    return 6;
  }

  active(options: ConstraintsOptions) {
    return !options.disableForce;
  }

  resetStates(): void {}

  readonly isInequalityConstraint = false;

  row: number = -1;

  relevantVariables: IVariable[];

  name: string;

  element: IElement;

  component: IComponent;

  pfs: PointForce[];

  omegaComponent: GeneralVariable;

  vO: ConstantVector3; // m/s

  p: VariableVector3;

  q: VariableQuaternion;

  f: VariableVector3[];

  omega: VariableScalar;

  forceError: IVector3;

  momentError: IVector3;

  g: Vector3;

  getVO: () => Vector3;

  c: IVector3;

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
    this.omegaComponent = params.omega;
    this.getVO = params.vO;
    this.pfs = [...params.pointForceComponents];
    this.pfCoefs = this.pfs.map((pf, i) => pf.sign(params.pfsPointNodeIDs[i]));
    this.conectedTireBalance = params.connectedTireBalance;
    this.relevantVariables = [this.component, this.omegaComponent, ...this.pfs];

    // 変数宣言
    this.p = new VariableVector3();
    this.q = new VariableQuaternion();
    this.f = this.pfs.map(() => new VariableVector3());
    this.omega = new VariableScalar();
    this.vO = new ConstantVector3(this.getVO());

    // 計算グラフ構築
    const {scale} = this.component;
    this.pfCoefs = this.pfs.map((pf, i) => pf.sign(params.pfsPointNodeIDs[i]));
    const {mass} = params;

    const localVec = params.points.map(
      (p) => new ConstantVector3(p.clone().multiplyScalar(scale))
    );

    const A = this.q.getRotationMatrix();
    const ptsQ = localVec.map((s, i) => A.vmul(s));

    // 重心を求める
    const cog = new ConstantVector3(params.cog.clone().multiplyScalar(scale));
    const cogQ = A.vmul(cog);
    const pCog = cogQ.add(this.p);
    const omega = normal.mul(this.omega);

    // 重力
    this.g = new Vector3(0, 0, -9810 * scale).multiplyScalar(mass);
    const g = new ConstantVector3(this.g);
    // 原点の遠心力
    const cO = omega.cross(this.vO).mul(-1);
    // 重心にかかる遠心力
    this.c = omega.cross(omega.cross(pCog)).mul(-1).add(cO).mul(mass);

    // 慣性力
    const ma = g.add(this.c);

    // 力のつり合い
    this.forceError = this.f
      .reduce((prev: IVector3, current, i) => {
        const f = current.mul(this.pfCoefs[i]);
        return prev.add(f);
      }, new ConstantVector3())
      .add(ma);

    // モーメントのつり合い
    this.momentError = this.f
      .reduce((prev: IVector3, current, i) => {
        const f = current.mul(this.pfCoefs[i]);
        const s = ptsQ[i];
        return prev.add(f.cross(s));
      }, new ConstantVector3())
      .add(ma.cross(cogQ));
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row, component: c, pfs, g} = this;

    // 値の設定
    this.vO.setValue(this.getVO());
    this.p.setValue(c.position);
    this.q.setValue(c.quaternion);
    this.pfs.forEach((pf, i) => {
      this.f[i].setValue(pf.force);
    });
    this.omega.setValue(this.omegaComponent.value);

    // 力のつり合い
    this.forceError.reset();
    const translation = this.forceError.vector3Value;
    phi[row + 0] = translation.x;
    phi[row + 1] = translation.y;
    phi[row + 2] = translation.z;
    // ヤコビアン設定
    this.forceError.diff(Matrix.eye(3, 3));
    this.p.setJacobian(phi_q, row, c.col + X);
    this.q.setJacobian(phi_q, row, c.col + Q0);
    this.pfs.forEach((pf, i) => {
      this.f[i].setJacobian(phi_q, row, pf.col + X);
    });
    this.omega.setJacobian(phi_q, row, this.omegaComponent.col);

    // モーメントのつり合い
    this.momentError.reset();
    const rotation = this.momentError.vector3Value;
    phi[row + 3] = rotation.x;
    phi[row + 4] = rotation.y;
    phi[row + 5] = rotation.z;
    // ヤコビアン設定
    this.momentError.diff(Matrix.eye(3, 3));
    this.p.setJacobian(phi_q, row + 3, c.col + X);
    this.q.setJacobian(phi_q, row + 3, c.col + Q0);
    this.pfs.forEach((pf, i) => {
      this.f[i].setJacobian(phi_q, row + 3, pf.col + X);
    });
    this.omega.setJacobian(phi_q, row + 3, this.omegaComponent.col);

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
