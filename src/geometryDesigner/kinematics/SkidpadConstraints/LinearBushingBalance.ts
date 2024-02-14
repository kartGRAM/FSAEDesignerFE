/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {Twin, OneOrTwo} from '@utils/atLeast';
import {Constraint} from '@gd/kinematics/IConstraint';
import {IVector3} from '@computationGraph/IVector3';
import {VariableVector3} from '@computationGraph/VariableVector3';
import {VariableScalar} from '@computationGraph/VariableScalar';
import {ConstantVector3} from '@computationGraph/Vector3';
import {VariableQuaternion} from '@computationGraph/VariableQuaternion';
import {Balance} from '../SkidpadConstraints';
import {
  IComponent,
  IVariable,
  FullDegreesComponent,
  isFullDegreesComponent,
  PointForce,
  GeneralVariable
} from '../KinematicComponents';

const X = 0;
const Q0 = 3;
const normal = new ConstantVector3(new Vector3(0, 0, 1));

export class LinearBushingBalance implements Constraint, Balance {
  static readonly className = 'LinearBushingBalance' as const;

  readonly className = LinearBushingBalance.className;

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

  name: string;

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

  c: IVector3;

  g: Vector3;

  readonly isBalance = true as const;

  constructor(params: {
    name: string;
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
    this.pfsFrame = [...params.pfsFrame];
    this.pfsRodEnd = [...params.pfsRodEnd];
    this.frameComponent = params.frameComponent;
    const {scale} = this.frameComponent;
    this.rodEndComponents = [...params.rodEndComponents];
    if (this.rodEndComponents[0] === this.rodEndComponents[1])
      throw new Error('RodEndの両端は別のコンポーネントと接続する必要あり');
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
    const pqMap = new Map<IComponent, [VariableVector3, VariableQuaternion]>();
    this.rodEndComponents.forEach((c) => {
      pqMap.set(c, [new VariableVector3(), new VariableQuaternion()]);
    });
    this.rp = this.rodEndComponents.map((c) => pqMap.get(c)![0]) as any;
    this.rq = this.rodEndComponents.map((c) => pqMap.get(c)![1]) as any;
    this.rf = this.pfsRodEnd.map(() => new VariableVector3()) as any;
    this.fp = new VariableVector3();
    this.fq = new VariableQuaternion();
    this.ff = this.pfsFrame.map(() => new VariableVector3()) as any;
    this.omega = new VariableScalar();
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

    const fA = this.fq.getRotationMatrix();
    const rA = this.rq.map((q) => q.getRotationMatrix());
    const cogQ = fA.vmul(cogLocalVec);
    const pCog = this.fp.add(cogQ);
    const pFrameQ = frameLocalVec.map((s) => fA.vmul(s));
    const pRodEndQ = rodEndLocalVec.map((s, i) => rA[i].vmul(s));

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
        return prev.add(f.cross(pFrameQ[i]));
      }, new ConstantVector3())
      .add(
        this.rfc.reduce((prev: IVector3, f, i) => {
          return prev.add(f.cross(pRodEndQ[i]));
        }, new ConstantVector3())
      )
      .add(ma.cross(cogQ));
  }

  applytoElement(): void {}

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
    this.forceError.reset({});
    const translation = this.forceError.vector3Value;
    phi[row + 0] = translation.x;
    phi[row + 1] = translation.y;
    phi[row + 2] = translation.z;
    // ヤコビアン設定
    this.forceError.diff(Matrix.eye(3, 3));
    this.fp.setJacobian(phi_q, row, this.frameComponent.col + X);
    this.fq.setJacobian(phi_q, row, this.frameComponent.col + Q0);
    this.rodEndComponents.forEach((c, i) => {
      this.rp[i].setJacobian(phi_q, row, c.col + X);
      if (isFullDegreesComponent(c))
        this.rq[i].setJacobian(phi_q, row, c.col + Q0);
    });
    this.pfsFrame.forEach((pf, i) => {
      this.ff[i].setJacobian(phi_q, row, pf.col + X);
    });
    this.pfsRodEnd.forEach((pf, i) => {
      this.rf[i].setJacobian(phi_q, row, pf.col + X);
    });
    this.omega.setJacobian(phi_q, row, this.omegaComponent.col);

    // モーメントのつり合い
    this.momentError.reset({variablesOnly: false});
    const rotation = this.momentError.vector3Value;
    phi[row + 3] = rotation.x;
    phi[row + 4] = rotation.y;
    phi[row + 5] = rotation.z;
    // ヤコビアン設定
    this.momentError.diff(Matrix.eye(3, 3));
    this.fp.setJacobian(phi_q, row + 3, this.frameComponent.col + X);
    this.fq.setJacobian(phi_q, row + 3, this.frameComponent.col + Q0);
    this.rodEndComponents.forEach((c, i) => {
      this.rp[i].setJacobian(phi_q, row + 3, c.col + X);
      if (isFullDegreesComponent(c))
        this.rq[i].setJacobian(phi_q, row + 3, c.col + Q0);
    });
    this.pfsFrame.forEach((pf, i) => {
      this.ff[i].setJacobian(phi_q, row + 3, pf.col + X);
    });
    this.pfsRodEnd.forEach((pf, i) => {
      this.rf[i].setJacobian(phi_q, row + 3, pf.col + X);
    });
    this.omega.setJacobian(phi_q, row + 3, this.omegaComponent.col);
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
