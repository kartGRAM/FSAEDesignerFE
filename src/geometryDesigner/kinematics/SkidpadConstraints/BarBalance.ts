/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {Twin} from '@utils/atLeast';
import {IBar} from '@gd/IElements/IBar';
import {Constraint, ConstraintsOptions} from '@gd/kinematics/IConstraint';
import {IScalar} from '@computationGraph/IScalar';
import {IVector3} from '@computationGraph/IVector3';
import {VariableVector3} from '@computationGraph/VariableVector3';
import {VariableScalar} from '@computationGraph/VariableScalar';
import {ConstantVector3} from '@computationGraph/ConstantVector3';
import {ConstantScalar} from '@computationGraph/ConstantScalar';
import {VariableQuaternion} from '@computationGraph/VariableQuaternion';
import {Balance} from '../SkidpadConstraints';
import {
  IComponent,
  IVariable,
  PointForce,
  GeneralVariable
} from '../KinematicComponents';

const normal = new ConstantVector3(new Vector3(0, 0, 1));

export class BarBalance implements Constraint, Balance {
  static className = 'BarBalance' as const;

  readonly className = BarBalance.className;

  isBalance: true = true;

  isSpring: boolean = false;

  freeLength: ConstantScalar;

  k: ConstantScalar; // N/m

  vO: ConstantVector3; // m/s

  p: Twin<VariableVector3>;

  q: Twin<VariableQuaternion>;

  f: Twin<VariableVector3>;

  omega: VariableScalar;

  forceError: IVector3;

  momentError: IVector3;

  springForceError: IScalar = new ConstantScalar(0);

  c: IVector3;

  g: Vector3;

  pfCoefs: Twin<number>;

  // 並進運動+回転
  constraints(options: ConstraintsOptions) {
    if (this.isSpring && !options.disableSpringElasticity) return 7;
    return 6;
  }

  active(options: ConstraintsOptions) {
    return !options.disableForce;
  }

  resetStates(): void {}

  readonly isInequalityConstraint = false;

  row: number = -1;

  name: string;

  pfs: Twin<PointForce>;

  components: Twin<IComponent>;

  omegaComponent: GeneralVariable;

  relevantVariables: IVariable[];

  getVO: () => Vector3;

  element: IBar;

  _setPreload: () => void = () => {};

  constructor(params: {
    name: string;
    components: Twin<IComponent>;
    element: IBar;
    points: Twin<Vector3>;
    mass: number;
    cog: number; // lhs基準
    pfs: Twin<PointForce>;
    pfsPointNodeIDs: string[]; // ジョイント部分のローカルベクトルのノードID 作用反作用どちらで使うかを判定する
    vO: () => Vector3; // 座標原点の速度
    omega: GeneralVariable; // 座標原点の角速度
    isSpring?: boolean;
    k?: number;
  }) {
    this.element = params.element;
    this.name = params.name;
    if (params.components[0] === params.components[1])
      throw new Error('コンポーネントは別である必要がある');
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
    this.p = this.components.map((c) => c.positionVariable) as any;
    this.q = this.components.map((c) => c.quaternionVariable) as any;
    this.f = this.pfs.map((pf) => pf.forceVariable) as any;
    this.omega = this.omegaComponent.cgVariable;
    this.k = new ConstantScalar(0);
    this.freeLength = new ConstantScalar(0);
    if (params.isSpring && params.k && params.k > 0) {
      this.isSpring = true;
      this.k.setValue(params.k);
    }
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
    const t = this.pfs.map((_, i) => i + (1 + -2 * i) * params.cog);

    const A = this.q.map((q) => q.getRotationMatrix());
    const pts = localVec.map((s, i) => this.p[i].add(A[i].vmul(s)));

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

    if (this.isSpring) {
      const u = pts[1].sub(pts[0]);
      const l = u.length();
      // 距離から算出される荷重
      const ideal = this.k.mul(this.freeLength.sub(l));

      const axis = u.normalize();
      const maN = ma.normalize();

      // 軸方向の力
      const fAxis = this.f.map((f, i) =>
        f.add(maN.mul(f.dot(maN))).mul(this.pfCoefs[i])
      );

      // 現在の軸方向の力の大きさ (|f| / cos(Θ) ) = |f|^2 / f・ax
      const fdotAx = fAxis.map((f) => f.dot(axis));
      const f2 = this.f.map((f) => f.dot(f));
      const fl = f2.map((f2, i) => f2.div(fdotAx[i]));
      const flMean = fl[0].sub(fl[1]).div(2);
      this.springForceError = flMean.sub(ideal);

      this._setPreload = () => {
        l.reset({});
        flMean.reset({});
        const length = l.scalarValue;
        const dl = flMean.scalarValue / this.k.scalarValue;
        this.freeLength.setValue(length + dl);
      };
    }
  }

  setPreload() {
    if (!this.isSpring) return;
    this._setPreload();
  }

  setJacobianAndConstraints(
    phi_q: Matrix,
    phi: number[],
    options: ConstraintsOptions
  ) {
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
    this.forceError.reset({});
    const translation = this.forceError.vector3Value;
    phi[row + 0] = translation.x;
    phi[row + 1] = translation.y;
    phi[row + 2] = translation.z;
    // ヤコビアン設定
    this.forceError.diff(Matrix.eye(3, 3));
    this.forceError.setJacobian(phi_q, row);

    // モーメントのつり合い
    this.momentError.reset({variablesOnly: false});
    const rotation = this.momentError.vector3Value;
    phi[row + 3] = rotation.x;
    phi[row + 4] = rotation.y;
    phi[row + 5] = rotation.z;
    // ヤコビアン設定
    this.momentError.diff(Matrix.eye(3, 3));
    this.momentError.setJacobian(phi_q, row + 3);

    if (this.isSpring && !options.disableSpringElasticity) {
      // ばね反力の誤差
      this.springForceError.reset({variablesOnly: false});
      const error = this.springForceError.scalarValue;
      phi[row + 6] = error;
      // ヤコビアン設定
      this.springForceError.diff(Matrix.eye(1, 1));
      this.springForceError.setJacobian(phi_q, row + 6);
    }
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }

  applytoElement() {
    const q = this.element.rotation.value.invert();
    const {element} = this;

    element.fixedPointForce = this.pfs[0].force
      .clone()
      .multiplyScalar(this.pfCoefs[0])
      .applyQuaternion(q);

    element.pointForce = this.pfs[1].force
      .clone()
      .multiplyScalar(this.pfCoefs[1])
      .applyQuaternion(q);
    element.centrifugalForce = this.c.vector3Value.applyQuaternion(q);
    element.gravity = this.g.clone().applyQuaternion(q);
  }
}

export function isBarBalance(c: Constraint): c is BarBalance {
  return c.className === BarBalance.className;
}
