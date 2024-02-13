/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {IElement} from '@gd/IElements';
import {Constraint, ConstraintsOptions} from '@gd/kinematics/IConstraint';
import {IVector3} from '@computationGraph/IVector3';
import {VariableVector3} from '@computationGraph/VariableVector3';
import {VariableScalar} from '@computationGraph/VariableScalar';
import {ConstantVector3} from '@computationGraph/Vector3';
import {VariableQuaternion} from '@computationGraph/VariableQuaternion';
import {TireBalance} from './TireBalance';
import {Balance} from '../SkidpadConstraints';
import {
  IComponent,
  IVariable,
  FullDegreesComponent,
  PointForce,
  GeneralVariable
} from '../KinematicComponents';

const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;

const normal = new ConstantVector3(new Vector3(0, 0, 1));

export class FDComponentBalance implements Constraint, Balance {
  static className = 'FDComponentBalance' as const;

  readonly className = FDComponentBalance.className;

  isBalance: true = true;

  // 並進運動+回転
  constraints() {
    if (this.conectedTireBalance) return 5;
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

  errorComponent: GeneralVariable;

  vO: ConstantVector3; // m/s

  p: VariableVector3;

  q: VariableQuaternion;

  f: VariableVector3[];

  omega: VariableScalar;

  error: VariableScalar;

  forceError: IVector3;

  momentError: IVector3;

  g: Vector3;

  getVO: () => Vector3;

  c: IVector3;

  pfCoefs: number[]; // ジョイント部分のローカルベクトルのノードID 作用反作用で定義

  conectedTireBalance?: TireBalance;

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
    error: GeneralVariable;
    connectedTireBalance?: TireBalance;
  }) {
    this.name = params.name;
    this.element = params.element;
    this.component = params.component;
    this.omegaComponent = params.omega;
    this.errorComponent = params.error;
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
    this.error = new VariableScalar();
    this.vO = new ConstantVector3(this.getVO());

    // 計算グラフ構築
    const {scale} = this.component;
    this.pfCoefs = this.pfs.map((pf, i) => pf.sign(params.pfsPointNodeIDs[i]));
    const {mass} = params;

    const localVec = params.points.map(
      (p) => new ConstantVector3(p.clone().multiplyScalar(scale))
    );

    const A = this.q.getRotationMatrix();
    const ptsQ = localVec.map((s) => A.vmul(s));

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

    // 作用反作用を考慮した力ベクトル
    const f = this.f.map((f, i) => f.mul(this.pfCoefs[i]));

    if (this.conectedTireBalance) {
      const tireVars = this.conectedTireBalance.getTireVariables(
        this.p,
        this.q,
        this.omega,
        this.error,
        f,
        ma,
        this.vO
      );
      // 力のつり合い
      this.forceError = f
        .reduce((prev: IVector3, f) => {
          return prev.add(f);
        }, new ConstantVector3())
        .add(ma)
        .add(tireVars.tireGroundForce)
        .add(tireVars.ma);

      // モーメントのつり合い
      this.momentError = f
        .reduce((prev: IVector3, f, i) => {
          const s = ptsQ[i];
          return prev.add(f.cross(s));
        }, new ConstantVector3())
        .add(ma.cross(cogQ))
        .add(tireVars.tireGroundForce.cross(tireVars.groundQ))
        .add(tireVars.ma.cross(tireVars.cogQ));
    } else {
      // 力のつり合い
      this.forceError = f
        .reduce((prev: IVector3, f) => {
          return prev.add(f);
        }, new ConstantVector3())
        .add(ma);

      // モーメントのつり合い
      this.momentError = f
        .reduce((prev: IVector3, f, i) => {
          const s = ptsQ[i];
          return prev.add(f.cross(s));
        }, new ConstantVector3())
        .add(ma.cross(cogQ));
    }
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row, component: c} = this;

    // 値の設定
    this.vO.setValue(this.getVO());
    this.p.setValue(c.position);
    this.q.setValue(c.quaternion);
    this.pfs.forEach((pf, i) => {
      this.f[i].setValue(pf.force);
    });
    this.omega.setValue(this.omegaComponent.value);
    this.error.setValue(this.errorComponent.value);
    // 輪荷重が正か調べる
    if (this.conectedTireBalance) this.conectedTireBalance.checkFz();

    // 力のつり合い
    this.forceError.reset({});
    const translation = this.forceError.vector3Value;
    phi[row + X] = translation.x;
    phi[row + Y] = translation.y;
    if (!this.conectedTireBalance) phi[row + Z] = translation.z;
    // ヤコビアン設定
    const ofs = this.conectedTireBalance ? 2 : 3;
    const I = Matrix.eye(ofs, 3);
    this.forceError.diff(I);
    this.p.setJacobian(phi_q, row, c.col + X);
    this.q.setJacobian(phi_q, row, c.col + Q0);
    this.pfs.forEach((pf, i) => {
      this.f[i].setJacobian(phi_q, row, pf.col);
    });
    this.omega.setJacobian(phi_q, row, this.omegaComponent.col);
    if (this.conectedTireBalance)
      this.error.setJacobian(phi_q, row, this.errorComponent.col);

    // モーメントのつり合い
    this.momentError.reset({variablesOnly: false});
    const rotation = this.momentError.vector3Value;
    phi[row + ofs + X] = rotation.x;
    phi[row + ofs + Y] = rotation.y;
    phi[row + ofs + Z] = rotation.z;
    // ヤコビアン設定
    this.momentError.diff(Matrix.eye(3, 3));
    this.p.setJacobian(phi_q, row + ofs, c.col + X);
    this.q.setJacobian(phi_q, row + ofs, c.col + Q0);
    this.pfs.forEach((pf, i) => {
      this.f[i].setJacobian(phi_q, row + ofs, pf.col);
    });
    this.omega.setJacobian(phi_q, row + ofs, this.omegaComponent.col);
    if (this.conectedTireBalance)
      this.error.setJacobian(phi_q, row + ofs, this.errorComponent.col);

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

  applytoElement() {
    if (this.conectedTireBalance) {
      this.conectedTireBalance.applytoElement();
    }
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}

export function isFDComponentBalance(c: Constraint): c is FDComponentBalance {
  return c.className === FDComponentBalance.className;
}
