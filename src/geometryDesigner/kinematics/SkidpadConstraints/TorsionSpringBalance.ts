/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {Twin, OneOrTwo} from '@utils/atLeast';
import {Constraint, ConstraintsOptions} from '@gd/kinematics/IConstraint';
import {ITorsionSpring} from '@gd/IElements/ITorsionSpring';
import {IVector3} from '@computationGraph/IVector3';
import {IScalar} from '@computationGraph/IScalar';
import {VariableVector3} from '@computationGraph/VariableVector3';
import {VariableScalar} from '@computationGraph/VariableScalar';
import {ConstantVector3} from '@computationGraph/ConstantVector3';
import {ConstantScalar} from '@computationGraph/ConstantScalar';
import {VariableQuaternion} from '@computationGraph/VariableQuaternion';
import {asin} from '@computationGraph/Functions';
import {Balance} from '../SkidpadConstraints';
import {
  IComponent,
  IVariable,
  FullDegreesComponent,
  PointForce,
  GeneralVariable
} from '../KinematicComponents';

const normal = new ConstantVector3(new Vector3(0, 0, 1));

export class TorsionSpringBalance implements Constraint, Balance {
  static readonly className = 'LinearBushingBalance' as const;

  readonly className = TorsionSpringBalance.className;

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

  element: ITorsionSpring;

  frameComponent: FullDegreesComponent;

  effortComponents: OneOrTwo<IComponent>;

  pfsFrame: Twin<PointForce>;

  pfsEffort: OneOrTwo<PointForce>;

  relevantVariables: IVariable[];

  getVO: () => Vector3;

  getK: () => number;

  omegaComponent: GeneralVariable;

  ep: OneOrTwo<VariableVector3>;

  eq: OneOrTwo<VariableQuaternion>;

  ef: OneOrTwo<VariableVector3>;

  efc: IVector3[];

  fp: VariableVector3;

  fq: VariableQuaternion;

  ff: Twin<VariableVector3>;

  ffc: IVector3[];

  vO: ConstantVector3; // m/s

  omega: VariableScalar;

  forceError: IVector3;

  momentError: IVector3;

  torqueError: IScalar;

  k: ConstantScalar;

  c: IVector3;

  g: Vector3;

  readonly isBalance = true as const;

  constructor(params: {
    name: string;
    element: ITorsionSpring;
    frameComponent: FullDegreesComponent;
    framePoints: Twin<Vector3>;
    effortComponents: Twin<IComponent>;
    effortPoints: Twin<Vector3>;
    mass: number;
    cog: Vector3; // FrameComponent基準
    pfsFrame: Twin<PointForce>;
    pfsEffort: Twin<PointForce>;
    pfsFramePointNodeIDs: string[]; // ジョイント部分のローカルベクトルのノードID 作用反作用どちらで使うかを判定する
    pfsEffortPointNodeIDs: string[]; // ジョイント部分のローカルベクトルのノードID 作用反作用どちらで使うかを判定する
    getVO: () => Vector3; // 座標原点の速度
    omega: GeneralVariable; // 座標原点の角速度
    k: () => number; // N-m / deg
  }) {
    this.name = params.name;
    this.element = params.element;
    this.pfsFrame = [...params.pfsFrame];
    this.pfsEffort = [...params.pfsEffort];
    this.frameComponent = params.frameComponent;
    const {scale} = this.frameComponent;
    this.effortComponents = [...params.effortComponents];
    this.getVO = params.getVO;
    this.getK = params.k;
    this.omegaComponent = params.omega;
    this.relevantVariables = [
      this.frameComponent,
      ...this.effortComponents,
      this.omegaComponent,
      ...this.pfsFrame,
      ...this.pfsEffort
    ];

    // 変数宣言
    const pqMap = new Map<IComponent, [VariableVector3, VariableQuaternion]>();
    this.effortComponents.forEach((c) => {
      pqMap.set(c, [c.positionVariable, c.quaternionVariable]);
    });
    pqMap.set(this.frameComponent, [
      this.frameComponent.positionVariable,
      this.frameComponent.quaternionVariable
    ]);

    // eslint-disable-next-line prefer-destructuring
    this.fp = pqMap.get(this.frameComponent)![0];
    // eslint-disable-next-line prefer-destructuring
    this.fq = pqMap.get(this.frameComponent)![1];
    this.ff = this.pfsFrame.map((pf) => pf.forceVariable) as any;

    this.ep = this.effortComponents.map((c) => pqMap.get(c)![0]) as any;
    this.eq = this.effortComponents.map((c) => pqMap.get(c)![1]) as any;
    this.ef = this.pfsEffort.map((pf) => pf.forceVariable) as any;

    this.omega = this.omegaComponent.cgVariable;
    this.vO = new ConstantVector3(this.getVO());
    this.k = new ConstantScalar(this.getK());

    // 計算グラフ構築
    const pfCoefsFrame = this.pfsFrame.map((pf, i) =>
      pf.sign(params.pfsFramePointNodeIDs[i])
    );
    const pfCoefsEffort = this.pfsEffort.map((pf, i) =>
      pf.sign(params.pfsEffortPointNodeIDs[i])
    );
    this.ffc = this.ff.map((f, i) => f.mul(pfCoefsFrame[i]));
    this.efc = this.ef.map((f, i) => f.mul(pfCoefsEffort[i]));

    const {mass} = params;
    this.g = new Vector3(0, 0, -9810 * scale).multiplyScalar(mass);
    const g = new ConstantVector3(this.g);

    const cogLocalVec = new ConstantVector3(
      params.cog.clone().multiplyScalar(scale)
    );
    const frameLocalVec = params.framePoints.map(
      (p) => new ConstantVector3(p.clone().multiplyScalar(scale))
    );
    const effortLocalVec = params.effortPoints.map(
      (p) => new ConstantVector3(p.clone().multiplyScalar(scale))
    );

    const fA = this.fq.getRotationMatrix();
    const eA = this.eq.map((q) => q.getRotationMatrix());
    const pCog = fA.vmul(cogLocalVec).add(this.fp);
    const ptsFrame = frameLocalVec.map((s) => fA.vmul(s).add(this.fp));
    const ptsEffort = effortLocalVec.map((s, i) =>
      eA[i].vmul(s).add(this.ep[i])
    );
    const omega = normal.mul(this.omega);

    // 原点の遠心力
    const cO = omega.cross(this.vO).mul(-1);
    // 重心にかかる遠心力
    this.c = omega.cross(omega.cross(pCog)).mul(-1).add(cO).mul(mass);

    // 慣性力
    const ma = g.add(this.c);

    // ばね
    const localAxisVec = new ConstantVector3(
      frameLocalVec[1].sub(frameLocalVec[0]).normalize().vector3Value
    );
    const axis = fA.vmul(localAxisVec);
    const temp = ptsEffort.map((p) => p.sub(ptsFrame[0]));
    const armVec = temp.map((v) => v.sub(axis.mul(axis.dot(v))));
    const armVecN = armVec.map((v) => v.normalize());
    // 2つのアームのなす角
    const sinTheta = armVecN[0].cross(armVecN[1]).dot(axis);
    const theta = asin(sinTheta).mul(180 / Math.PI);
    // 本来発生するトルク(N-m)
    const tIdeal = theta.mul(this.k);
    // 実際に発生している力
    const tActual = this.efc[0].cross(armVec[0]).dot(axis);
    this.torqueError = tIdeal.sub(tActual);

    // 力のつり合い
    this.forceError = this.ffc
      .reduce((prev: IVector3, f) => {
        return prev.add(f);
      }, new ConstantVector3())
      .add(
        this.efc.reduce((prev: IVector3, f) => {
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
        this.efc.reduce((prev: IVector3, f, i) => {
          return prev.add(f.cross(ptsEffort[i]));
        }, new ConstantVector3())
      )
      .add(ma.cross(pCog));
  }

  saveState(): number[] {
    return [];
  }

  restoreState(): void {}

  applytoElement(): void {
    /*
    const q = this.element.rotation.value.invert();
    const {element} = this;

    element.fixedPointForce = this.ffc.map((f) =>
      f.vector3Value.applyQuaternion(q)
    );

    element.pointForce = this.efc.map((f) => f.vector3Value.applyQuaternion(q));
    element.centrifugalForce = this.c.vector3Value.applyQuaternion(q);
    element.gravity = this.g.clone().applyQuaternion(q); */
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row} = this;

    // 値の設定
    this.vO.setValue(this.getVO());
    this.k.setValue(this.getK());
    this.fp.setValue(this.frameComponent.position);
    this.fq.setValue(this.frameComponent.quaternion);
    this.effortComponents.forEach((c, i) => {
      this.ep[i].setValue(c.position);
      this.eq[i].setValue(c.quaternion);
    });
    this.pfsFrame.forEach((pf, i) => {
      this.ff[i].setValue(pf.force);
    });
    this.pfsEffort.forEach((pf, i) => {
      this.ef[i].setValue(pf.force);
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
    this.torqueError.reset({variablesOnly: false, resetKey});
    const e = this.torqueError.scalarValue;
    phi[row + 6] = e;
    // ヤコビアン設定
    this.torqueError.diff(Matrix.eye(1, 1));
    this.torqueError.setJacobian(phi_q, row + 6);
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}

export function isTorsionSpringBalance(
  c: Constraint
): c is TorsionSpringBalance {
  return c.className === TorsionSpringBalance.className;
}
