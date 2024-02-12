/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {Twin} from '@utils/atLeast';
import {ITire} from '@gd/IElements/ITire';
import {Constraint, ConstraintsOptions} from '@gd/kinematics/IConstraint';
import {IVector3} from '@computationGraph/IVector3';
import {IScalar} from '@computationGraph/IScalar';
import {VariableVector3} from '@computationGraph/VariableVector3';
import {VariableScalar} from '@computationGraph/VariableScalar';
import {ConstantVector3} from '@computationGraph/Vector3';
import {ConstantScalar} from '@computationGraph/ConstantScalar';
import {VariableQuaternion} from '@computationGraph/VariableQuaternion';
import {asin} from '@computationGraph/Functions';
import {
  IComponent,
  IVariable,
  FullDegreesComponent,
  PointForce,
  GeneralVariable
} from '../KinematicComponents';
import {getFrictionRotation} from '../KinematicFunctions';
import {Balance} from '../SkidpadConstraints';

const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;

const normal = new ConstantVector3(new Vector3(0, 0, 1));

export class TireBalance implements Constraint, Balance {
  static className = 'TireBalance' as const;

  readonly className = TireBalance.className;

  isBalance: true = true;

  // 並進運動+回転
  constraints() {
    return 5;
  }

  active(options: ConstraintsOptions) {
    return !options.disableForce;
  }

  resetStates(): void {}

  readonly isInequalityConstraint = false;

  row: number = -1;

  name: string;

  component: IComponent;

  pfs: Twin<PointForce>;

  omegaComponent: GeneralVariable;

  errorComponent: GeneralVariable;

  vO: ConstantVector3; // m/s

  p: VariableVector3;

  q: VariableQuaternion;

  f: VariableVector3[];

  fz: IVector3;

  omega: VariableScalar;

  error: VariableScalar;

  forceError: IVector3;

  momentError: IVector3;

  g: Vector3;

  getVO: () => Vector3;

  c: IVector3;

  friction: IVector3;

  k: IVector3;

  ferror: IVector3;

  element: ITire;

  relevantVariables: IVariable[];

  pfCoefs: Twin<number>; // ジョイント部分を作用反作用どちらで使うか

  disableTireFriction: boolean = false;

  constructor(params: {
    name: string;
    component: FullDegreesComponent;
    element: ITire;
    points: Twin<Vector3>; // Component基準
    mass: number;
    cog: number;
    pfs: Twin<PointForce>; // Bearing部分
    pfsPointNodeIDs: Twin<string>; // ジョイント部分のローカルベクトルのノードID 作用反作用で定義
    vO: () => Vector3; // 座標原点の速度
    omega: GeneralVariable; // 座標原点の角速度
    torqueRatio: number;
    getFriction: (sa: IScalar, ia: IScalar, fz: IScalar) => IVector3; // タイヤの発生する力
    error: GeneralVariable;
    getGround: (q: VariableQuaternion) => IVector3; // コンポーネント座標系における接地点
    tireRadius: number; // タイヤ半径
  }) {
    const {
      name,
      component,
      element,
      mass,
      cog,
      points, // Component基準
      pfs, // Bearing部分
      getGround,
      getFriction // タイヤの発生する力
    } = params;

    this.name = name;
    this.component = component;
    this.element = element;
    this.pfs = [...pfs];
    this.pfCoefs = this.pfs.map((pf, i) =>
      pf.sign(params.pfsPointNodeIDs[i])
    ) as Twin<number>;
    this.errorComponent = params.error;
    this.omegaComponent = params.omega;
    this.getVO = params.vO;
    this.relevantVariables = [
      this.component,
      this.omegaComponent,
      this.errorComponent,
      ...this.pfs
    ];

    // 変数宣言
    this.p = new VariableVector3();
    this.q = new VariableQuaternion();
    this.f = this.pfs.map(() => new VariableVector3());
    this.omega = new VariableScalar();
    this.error = new VariableScalar();
    this.vO = new ConstantVector3(this.getVO());

    // 計算グラフ構築
    const {scale} = this.component;
    const localVec = points.map(
      (p) => new ConstantVector3(p.clone().multiplyScalar(scale))
    );

    const A = this.q.getRotationMatrix();
    const ptsQ = localVec.map((s) => A.vmul(s));

    // 重心を求める
    const cog2 = 1 - cog;
    const localCog = localVec[0].mul(cog2).add(localVec[1].mul(cog));
    const cogQ = A.vmul(localCog);
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

    const tireRadius = params.tireRadius * this.component.scale;
    let localAxis = localVec[1].sub(localVec[0]).normalize();

    // 地面に平行なベクトル
    let para = localAxis.cross(normal);
    if (para.dot(new Vector3(1, 0, 0)).scalarValue < 0) {
      // Axisが進行方向に逆向きなら逆にする
      localAxis = localVec[0].sub(localVec[1]).normalize();
    }
    // 軸と地面に平行なベクトル
    const axis = A.vmul(localAxis);
    para = axis.cross(normal);
    this.k = para.normalize();

    // 接地点
    const ground = getGround(this.q);
    const groundQ = A.vmul(ground);
    const pGround = groundQ.add(this.p);

    // 接地点の速度
    const vOmega = omega.cross(pGround);
    const vGround = this.vO.add(vOmega);
    const vGn = vGround.normalize();

    // sin(sa) の取得
    const sinSa = normal.dot(this.k.cross(vGn));

    // sa の取得
    const sa = asin(sinSa).mul(180 / Math.PI);

    // iaの取得
    /* const tireVirtical = axis.clone().cross(k).normalize();
    const iaSin = tireVirtical.clone().cross(normal).dot(k);
    let ia = (Math.asin(iaSin) * 180) / Math.PI; */
    const ia = new ConstantScalar(0); // iaの求め方がおかしい

    // fzの取得
    // normal方向成分を求める
    const maz = normal.mul(ma.dot(normal).mul(-1));
    const fz = this.f.map((f, i) =>
      normal.mul(f.dot(normal).mul(-this.pfCoefs[i]))
    );
    this.fz = fz
      .reduce((prev: IVector3, fz) => {
        return prev.add(fz);
      }, new ConstantVector3())
      .add(maz);
    const fzScalar = this.fz.dot(normal);

    // タイヤの力
    const frictionOrg = params.getFriction(sa, ia, fzScalar);
    const frictionR = getFrictionRotation(this.k);
    this.friction = frictionR.vmul(frictionOrg);

    const frictionX = frictionOrg.dot(new Vector3(1, 0, 0));

    this.ferror = this.k.mul(this.error).mul(params.torqueRatio);

    // 駆動力による車軸周りのモーメント(車軸周りのモーメントはこの項がないと釣り合わない)
    const lmX = frictionX
      .add(this.error.mul(params.torqueRatio))
      .mul(-tireRadius);
    const mX = axis.mul(lmX);

    // 力のつり合い
    this.forceError = this.f
      .reduce((prev: IVector3, f, i) => {
        const fi = f.mul(this.pfCoefs[i]);
        return prev.add(fi);
      }, new ConstantVector3())
      .add(ma)
      .add(this.fz)
      .add(this.friction)
      .add(this.ferror);

    // 部品原点まわりのモーメントつり合い
    // 変分の方程式がわかりやすくなるようにあえて、力x距離にする
    const groundForce = this.friction.add(this.ferror).add(this.fz);
    this.momentError = this.f
      .reduce((prev: IVector3, f, i) => {
        const mf = f.mul(this.pfCoefs[i]).cross(ptsQ[i]);
        return prev.add(mf);
      }, new ConstantVector3())
      .add(ma.cross(cogQ))
      .add(groundForce.cross(groundQ))
      .add(mX);
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row} = this;
    const {component: c} = this;

    // 値の設定
    this.vO.setValue(this.getVO());
    this.p.setValue(c.position);
    this.q.setValue(c.quaternion);
    this.pfs.forEach((pf, i) => {
      this.f[i].setValue(pf.force);
    });
    this.omega.setValue(this.omegaComponent.value);
    this.error.setValue(this.errorComponent.value);

    this.fz.reset();
    if (this.fz.vector3Value.z < 0) {
      throw new Error('Fzが負:インリフトした');
    }

    // 力のつり合い
    this.forceError.reset();
    const translation = this.forceError.vector3Value;
    this.forceError.diff(Matrix.eye(2, 3));
    phi[row + X] = translation.x;
    phi[row + Y] = translation.y;

    this.p.setJacobian(phi_q, row, c.col + X);
    this.q.setJacobian(phi_q, row, c.col + Q0);
    this.pfs.forEach((pf, i) => {
      this.f[i].setJacobian(phi_q, row, pf.col + X);
    });
    this.omega.setJacobian(phi_q, row, this.omegaComponent.col);
    this.error.setJacobian(phi_q, row, this.errorComponent.col);

    // モーメントのつり合い
    this.momentError.reset();
    const rotation = this.momentError.vector3Value;
    this.momentError.diff(Matrix.eye(3, 3));
    phi[row + 2 + X] = rotation.x;
    phi[row + 2 + Y] = rotation.y;
    phi[row + 2 + Z] = rotation.z;
    this.p.setJacobian(phi_q, row + 2, c.col + X);
    this.q.setJacobian(phi_q, row + 2, c.col + Q0);
    this.pfs.forEach((pf, i) => {
      this.f[i].setJacobian(phi_q, row + 2, pf.col + X);
    });
    this.omega.setJacobian(phi_q, row + 2, this.omegaComponent.col);
    this.error.setJacobian(phi_q, row + 2, this.errorComponent.col);
  }

  applytoElement() {
    const friction = this.friction.vector3Value;
    const fe = this.ferror.vector3Value;
    const k = this.k.vector3Value;
    const fall = friction.clone().add(fe);
    const fx = k.clone().multiplyScalar(k.dot(fall));
    const fy = fall.clone().sub(fx);
    const fz = this.fz.vector3Value;
    const q = this.element.rotation.value.invert();

    const {element} = this;
    element.fx = fx.applyQuaternion(q);
    element.fy = fy.applyQuaternion(q);
    element.fz = fz.applyQuaternion(q);
    element.outerBearingForce = this.pfs[0].force
      .clone()
      .multiplyScalar(this.pfCoefs[0])
      .applyQuaternion(q);
    element.innerBearingForce = this.pfs[1].force
      .clone()
      .multiplyScalar(this.pfCoefs[1])
      .applyQuaternion(q);
    element.centrifugalForce = this.c.vector3Value.applyQuaternion(q);
    element.gravity = this.g.clone().applyQuaternion(q);
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}

export function isTireBalance(c: Constraint): c is TireBalance {
  return c.className === TireBalance.className;
}
