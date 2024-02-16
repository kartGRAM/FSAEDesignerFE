/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
import {Vector3} from 'three';
import {SingularValueDecomposition} from 'ml-matrix';
import {Twin} from '@utils/atLeast';
import {ITire} from '@gd/IElements/ITire';
import {ConstraintsOptions} from '@gd/kinematics/IConstraint';
import {IVector3} from '@computationGraph/IVector3';
import {IScalar} from '@computationGraph/IScalar';
import {VariableVector3} from '@computationGraph/VariableVector3';
import {VariableScalar} from '@computationGraph/VariableScalar';
import {ConstantVector3} from '@computationGraph/ConstantVector3';
import {ConstantScalar} from '@computationGraph/ConstantScalar';
import {VariableQuaternion} from '@computationGraph/VariableQuaternion';
import {asin} from '@computationGraph/Functions';
import {IComponent, FullDegreesComponent} from '../KinematicComponents';
import {
  getFrictionRotation,
  skew,
  getVVector,
  getVector3
} from '../KinematicFunctions';

const normal = new ConstantVector3(new Vector3(0, 0, 1));

export class TireBalance {
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

  fz: IVector3 = new ConstantVector3();

  mX: IVector3 = new ConstantVector3();

  g: Vector3;

  mass: number;

  torqueRatio: number;

  tireRadius: number;

  getGround: (q: VariableQuaternion) => IVector3; // コンポーネント座標系における接地点

  getFriction: (sa: IScalar, ia: IScalar, fz: IScalar) => IVector3; // タイヤの発生する力

  c: IVector3 = new ConstantVector3();

  friction: IVector3 = new ConstantVector3();

  k: IVector3 = new ConstantVector3();

  localAxis: IVector3;

  localVec: IVector3[];

  localCog: IVector3;

  ground: IVector3 = new ConstantVector3();

  groundVelocity: IScalar = new ConstantScalar(0);

  ferror: IVector3 = new ConstantVector3();

  element: ITire;

  disableTireFriction: boolean = false;

  constructor(params: {
    name: string;
    component: FullDegreesComponent;
    element: ITire;
    points: Twin<Vector3>; // Component基準
    mass: number;
    cog: number;
    torqueRatio: number;
    getFriction: (sa: IScalar, ia: IScalar, fz: IScalar) => IVector3; // タイヤの発生する力
    getGround: (q: VariableQuaternion) => IVector3; // コンポーネント座標系における接地点
    tireRadius: number; // タイヤ半径
  }) {
    const {
      name,
      component,
      element,
      cog,
      points // Component基準
    } = params;

    this.name = name;
    this.component = component;
    this.element = element;
    this.getGround = params.getGround;
    this.getFriction = params.getFriction;
    this.mass = params.mass;
    this.torqueRatio = params.torqueRatio;
    this.tireRadius = params.tireRadius * this.component.scale;

    // 計算グラフ構築
    const {scale} = this.component;
    this.g = new Vector3(0, 0, -9810 * scale).multiplyScalar(this.mass);

    const localVec = points.map(
      (p) => new ConstantVector3(p.clone().multiplyScalar(scale))
    );
    this.localVec = localVec;

    // 重心を求める
    const cog2 = 1 - cog;
    this.localCog = localVec[0].mul(cog2).add(localVec[1].mul(cog));

    this.localAxis = localVec[1].sub(localVec[0]).normalize();
    // 地面に平行なベクトル
    const para = this.localAxis.cross(normal);
    if (para.dot(new Vector3(1, 0, 0)).scalarValue < 0) {
      // Axisが進行方向に逆向きなら逆にする
      this.localAxis = localVec[0].sub(localVec[1]).normalize();
    }
  }

  checkFz() {
    this.fz.reset({});
    // eslint-disable-next-line no-unreachable
    if (this.fz.vector3Value.z < 0) {
      throw new Error('fzが負になった');
    }
  }

  getTireVariables(
    p: VariableVector3,
    q: VariableQuaternion,
    omegaScalar: VariableScalar,
    error: VariableScalar,
    f: IVector3[],
    uprightMa: IVector3,
    vO: IVector3
  ) {
    // 変数宣言
    const A = q.getRotationMatrix();
    const cogQ = A.vmul(this.localCog);
    const pCog = cogQ.add(p);
    const omega = normal.mul(omegaScalar);

    // 重力
    const g = new ConstantVector3(this.g);
    // 原点の遠心力
    const cO = omega.cross(vO).mul(-1);
    // 重心にかかる遠心力
    this.c = omega.cross(omega.cross(pCog)).mul(-1).add(cO).mul(this.mass);
    // 慣性力
    const ma = g.add(this.c);

    // 軸と地面に平行なベクトル
    const axis = A.vmul(this.localAxis);
    const para = axis.cross(normal);
    this.k = para.normalize();

    // 接地点
    this.ground = this.getGround(q);
    const groundQ = A.vmul(this.ground);
    const pGround = groundQ.add(p);

    // 接地点の速度
    const vOmega = omega.cross(pGround);
    const vGround = vO.add(vOmega);
    const vGn = vGround.normalize();
    this.groundVelocity = vGround.dot(this.k);

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
    const uprightMaz = normal.mul(uprightMa.dot(normal).mul(-1));
    const fz = f.map((f) => normal.mul(f.dot(normal).mul(-1)));
    this.fz = fz
      .reduce((prev: IVector3, fz) => {
        return prev.add(fz);
      }, new ConstantVector3())
      .add(maz)
      .add(uprightMaz);
    const fzScalar = this.fz.dot(normal);

    // タイヤの力
    const frictionOrg = this.getFriction(sa, ia, fzScalar);
    const frictionR = getFrictionRotation(this.k);
    this.friction = frictionR.vmul(frictionOrg);

    const frictionX = frictionOrg.dot(new Vector3(1, 0, 0));

    this.ferror = this.k.mul(error).mul(this.torqueRatio);

    const tireGroundForce = this.friction.add(this.ferror).add(this.fz);

    // 駆動力による車軸周りのモーメント(車軸周りのモーメントはこの項がないと釣り合わない)
    const lmX = frictionX
      .add(error.mul(this.torqueRatio))
      .mul(-this.tireRadius);
    this.mX = axis.mul(lmX);

    return {
      tireGroundForce,
      groundQ,
      ma,
      cogQ
    };
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
    element.centrifugalForce = this.c.vector3Value.applyQuaternion(q);
    element.gravity = this.g.clone().applyQuaternion(q);

    this.mX.reset({});
    const mX = this.mX.vector3Value;
    const tireGroundForce = element.fx.clone().add(element.fy).add(element.fz);
    const ground = skew(this.ground.vector3Value);
    const ma = element.centrifugalForce.clone().add(element.gravity);
    const cog = skew(this.localCog.vector3Value);
    const localVec = this.localVec.map((v) => skew(v.vector3Value));

    const sumF = getVVector(tireGroundForce.clone().add(ma).multiplyScalar(-1));

    const SgFg = ground.mmul(getVVector(tireGroundForce));
    const ScMa = cog.mmul(getVVector(ma));
    const sumM = SgFg.clone().add(ScMa).add(getVVector(mX)).mul(-1);

    const S2SumF = localVec[1].mmul(sumF);
    sumM.sub(S2SumF);
    const F1Coef = localVec[0].sub(localVec[1]);
    const F1 = new SingularValueDecomposition(F1Coef, {
      autoTranspose: true
    }).solve(sumM);
    const F2 = sumF.clone().sub(F1);

    element.outerBearingForce = getVector3(F1);
    element.innerBearingForce = getVector3(F2);

    const v = this.groundVelocity.scalarValue;
    element.angularVelocity = v / this.tireRadius; // rad/s
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}
