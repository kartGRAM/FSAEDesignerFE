/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {Twin, OneOrTwo} from '@utils/atLeast';
import {Constraint, ConstraintsOptions} from '@gd/kinematics/IConstraint';
import {ILinearBushing} from '@gd/IElements/ILinearBushing';
import {IVector3} from '@computationGraph/IVector3';
import {IScalar} from '@computationGraph/IScalar';
import {VariableVector3} from '@computationGraph/VariableVector3';
import {VariableScalar} from '@computationGraph/VariableScalar';
import {ConstantVector3} from '@computationGraph/ConstantVector3';
import {VariableQuaternion} from '@computationGraph/VariableQuaternion';
import {Balance} from '../SkidpadConstraints';
import {
  IComponent,
  IVariable,
  FullDegreesComponent,
  PointForce,
  GeneralVariable
} from '../KinematicComponents';

const normal = new ConstantVector3(new Vector3(0, 0, 1));

export class LinearBushingBalance implements Constraint, Balance {
  static readonly className = 'LinearBushingBalance' as const;

  readonly className = LinearBushingBalance.className;

  // 並進運動+回転
  constraints() {
    return 7;
  }

  active(options: ConstraintsOptions) {
    return !options.disableForce;
  }

  resetStates(): void {}

  readonly isInequalityConstraint = false;

  row: number = -1;

  name: string;

  element: ILinearBushing;

  pfsRodEnd: OneOrTwo<PointForce>;

  pfsFrame: Twin<PointForce>;

  frameComponent: FullDegreesComponent;

  rodEndComponents: OneOrTwo<IComponent>;

  relevantVariables: IVariable[];

  getVO: () => Vector3;

  omegaComponent: GeneralVariable;

  rp: OneOrTwo<VariableVector3>;

  rq: OneOrTwo<VariableQuaternion>;

  rf: OneOrTwo<VariableVector3>;

  rfc: IVector3[];

  fp: VariableVector3;

  fq: VariableQuaternion;

  ff: Twin<VariableVector3>;

  ffc: IVector3[];

  vO: ConstantVector3; // m/s

  omega: VariableScalar;

  forceError: IVector3;

  momentError: IVector3;

  fixedForceError: IScalar;

  c: IVector3;

  g: Vector3;

  readonly isBalance = true as const;

  constructor(params: {
    name: string;
    element: ILinearBushing;
    frameComponent: FullDegreesComponent;
    framePoints: Twin<Vector3>;
    rodEndComponents: OneOrTwo<IComponent>;
    rodEndPoints: OneOrTwo<Vector3>;
    mass: number;
    cog: Vector3; // FrameComponent基準
    pfsFrame: Twin<PointForce>;
    pfsRodEnd: OneOrTwo<PointForce>;
    pfsFramePointNodeIDs: string[]; // ジョイント部分のローカルベクトルのノードID 作用反作用どちらで使うかを判定する
    pfsRodEndPointNodeIDs: string[]; // ジョイント部分のローカルベクトルのノードID 作用反作用どちらで使うかを判定する
    getVO: () => Vector3; // 座標原点の速度
    omega: GeneralVariable; // 座標原点の角速度
  }) {
    this.name = params.name;
    this.element = params.element;
    this.pfsFrame = [...params.pfsFrame];
    this.pfsRodEnd = [...params.pfsRodEnd];
    this.frameComponent = params.frameComponent;
    const {scale} = this.frameComponent;
    this.rodEndComponents = [...params.rodEndComponents];
    this.getVO = params.getVO;
    this.omegaComponent = params.omega;
    this.relevantVariables = [
      this.frameComponent,
      ...this.rodEndComponents,
      this.omegaComponent,
      ...this.pfsFrame,
      ...this.pfsRodEnd
    ];

    // 変数宣言
    this.fp = this.frameComponent.positionVariable;
    this.fq = this.frameComponent.quaternionVariable;
    this.ff = this.pfsFrame.map((pf) => pf.forceVariable) as any;

    const pqMap = new Map<IComponent, [VariableVector3, VariableQuaternion]>();
    this.rodEndComponents.forEach((c) => {
      pqMap.set(c, [c.positionVariable, c.quaternionVariable]);
    });
    this.rp = this.rodEndComponents.map((c) => pqMap.get(c)![0]) as any;
    this.rq = this.rodEndComponents.map((c) => pqMap.get(c)![1]) as any;
    this.rf = this.pfsRodEnd.map((pf) => pf.forceVariable) as any;

    this.omega = this.omegaComponent.cgVariable;
    this.vO = new ConstantVector3(this.getVO());

    // 計算グラフ構築
    const pfCoefsFrame = this.pfsFrame.map((pf, i) =>
      pf.sign(params.pfsFramePointNodeIDs[i])
    );
    const pfCoefsRodEnd = this.pfsRodEnd.map((pf, i) =>
      pf.sign(params.pfsRodEndPointNodeIDs[i])
    );
    this.ffc = this.ff.map((f, i) => f.mul(pfCoefsFrame[i]));
    this.rfc = this.rf.map((f, i) => f.mul(pfCoefsRodEnd[i]));

    const {mass} = params;
    this.g = new Vector3(0, 0, -9810 * scale).multiplyScalar(mass);
    const g = new ConstantVector3(this.g);

    const cogLocalVec = new ConstantVector3(
      params.cog.clone().multiplyScalar(scale)
    );
    const frameLocalVec = params.framePoints.map(
      (p) => new ConstantVector3(p.clone().multiplyScalar(scale))
    );
    const rodEndLocalVec = params.rodEndPoints.map(
      (p) => new ConstantVector3(p.clone().multiplyScalar(scale))
    );

    const localAxisVec = frameLocalVec[1].sub(frameLocalVec[0]);

    const fA = this.fq.getRotationMatrix();
    const rA = this.rq.map((q) => q.getRotationMatrix());
    const pCog = fA.vmul(cogLocalVec).add(this.fp);
    const ptsFrame = frameLocalVec.map((s) => fA.vmul(s).add(this.fp));
    const ptsRodEnd = rodEndLocalVec.map((s, i) =>
      rA[i].vmul(s).add(this.rp[i])
    );
    const axis = fA.vmul(localAxisVec).normalize();

    const omega = normal.mul(this.omega);

    // 原点の遠心力
    const cO = omega.cross(this.vO).mul(-1);
    // 重心にかかる遠心力
    this.c = omega.cross(omega.cross(pCog)).mul(-1).add(cO).mul(mass);

    // 慣性力
    const ma = g.add(this.c);

    // 力のつり合い
    this.forceError = this.ffc
      .reduce((prev: IVector3, f) => {
        return prev.add(f);
      }, new ConstantVector3())
      .add(
        this.rfc.reduce((prev: IVector3, f) => {
          return prev.add(f);
        }, new ConstantVector3())
      )
      .add(ma);

    // モーメントのつり合い
    this.momentError = this.ffc
      .reduce((prev: IVector3, f, i) => {
        return prev.add(f.cross(ptsFrame[i]));
      }, new ConstantVector3())
      .add(
        this.rfc.reduce((prev: IVector3, f, i) => {
          return prev.add(f.cross(ptsRodEnd[i]));
        }, new ConstantVector3())
      )
      .add(ma.cross(pCog));

    this.fixedForceError = this.ffc[1].dot(axis).sub(this.ffc[0].dot(axis));
  }

  applytoElement(): void {
    const q = this.element.rotation.value.invert();
    const {element} = this;

    element.fixedPointForce = this.ffc.map((f) =>
      f.vector3Value.applyQuaternion(q)
    );

    element.pointForce = this.rfc.map((f) => f.vector3Value.applyQuaternion(q));
    element.centrifugalForce = this.c.vector3Value.applyQuaternion(q);
    element.gravity = this.g.clone().applyQuaternion(q);
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row} = this;

    // 値の設定
    this.vO.setValue(this.getVO());
    this.fp.setValue(this.frameComponent.position);
    this.fq.setValue(this.frameComponent.quaternion);
    this.rodEndComponents.forEach((c, i) => {
      this.rp[i].setValue(c.position);
      this.rq[i].setValue(c.quaternion);
    });
    this.pfsFrame.forEach((pf, i) => {
      this.ff[i].setValue(pf.force);
    });
    this.pfsRodEnd.forEach((pf, i) => {
      this.rf[i].setValue(pf.force);
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
    this.momentError.reset({variablesOnly: false, resetKey});
    const rotation = this.momentError.vector3Value;
    phi[row + 3] = rotation.x;
    phi[row + 4] = rotation.y;
    phi[row + 5] = rotation.z;
    // ヤコビアン設定
    this.momentError.diff(Matrix.eye(3, 3));
    this.momentError.setJacobian(phi_q, row + 3);

    // フレーム側の制約
    this.fixedForceError.reset({variablesOnly: false, resetKey});
    const e = this.fixedForceError.scalarValue;
    phi[row + 6] = e;
    // ヤコビアン設定
    this.fixedForceError.diff(Matrix.eye(1, 1));
    this.fixedForceError.setJacobian(phi_q, row + 6);
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}

export function isLinearBushingBalance(
  c: Constraint
): c is LinearBushingBalance {
  return c.className === LinearBushingBalance.className;
}
