/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable camelcase */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {Triple} from '@utils/atLeast';
import {IAArm} from '@gd/IElements/IAArm';
import {Constraint, ConstraintsOptions} from '@gd/kinematics/IConstraint';
import {IVector3} from '@computationGraph/IVector3';
import {VariableVector3} from '@computationGraph/VariableVector3';
import {VariableScalar} from '@computationGraph/VariableScalar';
import {ConstantVector3} from '@computationGraph/ConstantVector3';
import {VariableQuaternion} from '@computationGraph/VariableQuaternion';
import {Balance} from '../SkidpadConstraints';
import {
  IComponent,
  IVariable,
  isFullDegreesComponent,
  PointForce,
  GeneralVariable
} from '../KinematicComponents';

const X = 0;
const Q0 = 3;

const normal = new ConstantVector3(new Vector3(0, 0, 1));

export class AArmBalance implements Constraint, Balance {
  static className = 'AArmBalance' as const;

  readonly className = AArmBalance.className;

  isBalance: true = true;

  p: Triple<VariableVector3>;

  q: Triple<VariableQuaternion>;

  f: Triple<VariableVector3>;

  vO: ConstantVector3; // m/s

  omega: VariableScalar;

  forceError: IVector3;

  momentError: IVector3;

  c: IVector3;

  g: Vector3;

  pfCoefs: Triple<number>;

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

  name: string;

  pfs: Triple<PointForce>;

  components: Triple<IComponent>;

  omegaComponent: GeneralVariable;

  relevantVariables: IVariable[];

  getVO: () => Vector3;

  element: IAArm;

  constructor(params: {
    name: string;
    components: Triple<IComponent>;
    element: IAArm;
    points: Triple<Vector3>;
    mass: number;
    cog: Vector3;
    pfs: Triple<PointForce>;
    pfsPointNodeIDs: string[]; // ジョイント部分のローカルベクトルのノードID 作用反作用どちらで使うかを判定する
    vO: () => Vector3; // 座標原点の速度
    omega: GeneralVariable; // 座標原点の角速度
  }) {
    this.element = params.element;
    this.name = params.name;
    /* if (params.components[0] === params.components[2])
      throw new Error('コンポーネントは別である必要がある'); */
    this.components = [...params.components];
    this.pfs = [...params.pfs];
    this.omegaComponent = params.omega;

    this.relevantVariables = [
      ...this.components,
      this.omegaComponent,
      ...this.pfs
    ];
    this.getVO = params.vO;

    // 変数宣言
    const pqMap = new Map<IComponent, [VariableVector3, VariableQuaternion]>();
    this.components.forEach((c) => {
      pqMap.set(c, [c.positionVariable, c.quaternionVariable]);
    });

    this.p = this.components.map((c) => pqMap.get(c)![0]) as any;
    this.q = this.components.map((c) => pqMap.get(c)![1]) as any;
    this.f = this.pfs.map((pf) => pf.forceVariable) as any;
    this.omega = this.omegaComponent.cgVariable;
    this.vO = new ConstantVector3(this.getVO());

    // 計算グラフ構築
    const {scale} = this.components[0];
    this.pfCoefs = this.pfs.map((pf, i) =>
      pf.sign(params.pfsPointNodeIDs[i])
    ) as any;
    const {mass} = params;
    this.g = new Vector3(0, 0, -9810 * this.components[0].scale).multiplyScalar(
      mass
    );
    const g = new ConstantVector3(this.g);

    const localVec = params.points.map(
      (p) => new ConstantVector3(p.clone().multiplyScalar(scale))
    );

    const A = this.q.map((q) => q.getRotationMatrix());
    const pts = localVec.map((s, i) => this.p[i].add(A[i].vmul(s)));
    const t = params.points.map((p) => params.cog.dot(p) / p.lengthSq());

    const pCog = pts.reduce(
      (prev, p, i) => prev.add(p.mul(t[i])),
      new ConstantVector3()
    );

    const omega = normal.mul(this.omega);

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
        const s = pts[i];
        return prev.add(f.cross(s));
      }, new ConstantVector3())
      .add(ma.cross(pCog));
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row} = this;

    // 値の設定
    this.vO.setValue(this.getVO());
    this.components.forEach((c, i) => {
      this.p[i].setValue(c.position);
      this.q[i].setValue(c.quaternion);
    });
    this.pfs.forEach((pf, i) => {
      this.f[i].setValue(pf.force);
    });
    this.omega.setValue(this.omegaComponent.value);

    // 力のつり合い
    const resetKey = this.forceError.reset({});
    const translation = this.forceError.vector3Value;
    phi[row + 0] = translation.x;
    phi[row + 1] = translation.y;
    phi[row + 2] = translation.z;
    // ヤコビアン設定
    this.forceError.diff(Matrix.eye(3, 3));
    this.forceError.setJacobian(phi_q, row);

    // モーメントのつり合い
    this.momentError.reset({variablesOnly: true, resetKey});
    const rotation = this.momentError.vector3Value;
    phi[row + 3] = rotation.x;
    phi[row + 4] = rotation.y;
    phi[row + 5] = rotation.z;
    // ヤコビアン設定
    this.momentError.diff(Matrix.eye(3, 3));
    this.momentError.setJacobian(phi_q, row + 3);
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }

  applytoElement() {
    const q = this.element.rotation.value.invert();
    const {element} = this;

    element.fixedPointForce = this.pfs
      .slice(0, 2)
      .map((f, i) =>
        f.force.clone().multiplyScalar(this.pfCoefs[i]).applyQuaternion(q)
      );

    element.pointForce = this.pfs.slice(2).map((f, i) =>
      f.force
        .clone()
        .multiplyScalar(this.pfCoefs[i + 2])
        .applyQuaternion(q)
    );
    element.centrifugalForce = this.c.vector3Value.applyQuaternion(q);
    element.gravity = this.g.clone().applyQuaternion(q);
  }
}

export function isAArmBalance(c: Constraint): c is AArmBalance {
  return c.className === AArmBalance.className;
}
