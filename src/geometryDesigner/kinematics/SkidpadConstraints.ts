/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import {Matrix} from 'ml-matrix';
import {Vector3, Quaternion} from 'three';
import {Triple, Twin, OneOrTwo} from '@utils/atLeast';
import {
  skew,
  rotationMatrix,
  decompositionMatrixG,
  getDeltaOmega,
  getFrictionRotation,
  // deltaXcross,
  getVVector
} from './KinematicFunctions';
import {
  IComponent,
  FullDegreesComponent,
  isFullDegreesComponent,
  PointForce,
  GeneralVariable
} from './KinematicComponents';
import {Constraint} from './Constraints';

const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Q1 = 4;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Q2 = 5;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Q3 = 6;

const normal = new Vector3(0, 0, 1);
const unitZ = getVVector(new Vector3(0, 0, 1));
const unitZSkew = skew(new Vector3(0, 0, 1));

export class FDComponentBalance implements Constraint {
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

  get lhs() {
    return this.component;
  }

  get rhs() {
    return this.component;
  }

  name: string;

  component: IComponent;

  pfs: PointForce[];

  cogLocalVec: Vector3;

  cogLocalSkew: Matrix;

  pointLocalVec: Vector3[];

  pointLocalSkew: Matrix[];

  g: Vector3 = new Vector3(0, 0, -9.81);

  mass: number;

  vO: () => Vector3;

  omega: GeneralVariable;

  pfCoefs: number[]; // ジョイント部分のローカルベクトルのノードID 作用反作用で定義

  constructor(params: {
    name: string;
    component: FullDegreesComponent;
    mass: number;
    cog: Vector3;
    points: Vector3[];
    pointForceComponents: PointForce[];
    pfsPointNodeIDs: string[]; // ジョイント部分のローカルベクトルのノードID 作用反作用どちらで使うかを判定する
    vO: () => Vector3; // 座標原点の速度
    omega: GeneralVariable;
  }) {
    this.name = params.name;
    this.component = params.component;
    this.mass = params.mass;
    this.vO = params.vO;
    this.omega = params.omega;
    this.pfs = [...params.pointForceComponents];
    this.pfCoefs = this.pfs.map((pf, i) => pf.sign(params.pfsPointNodeIDs[i]));

    this.cogLocalVec = params.cog.clone();
    this.cogLocalSkew = skew(this.cogLocalVec).mul(-2);

    this.pointLocalVec = params.points.map((p) => p.clone());
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
    const cO = omega.clone().cross(vO); // 車両座標系にかかる原点の遠心力
    const q = component.quaternion; // 注目している部品の姿勢
    // 部品の部品座標系での重心
    const cogQ = cogLocalVec.clone().applyQuaternion(q);
    const pCog = cogQ.clone().add(component.position);
    const cogSkewQ = skew(cogQ);
    const cogSkewP = skew(pCog);
    // 部品にかかる遠心力
    const c = omega.clone().cross(omega.clone().cross(pCog)).add(cO);
    const ma = g.clone().add(c).multiplyScalar(this.mass); // 遠心力＋重力
    const maSkew = skew(ma);

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
        const f = current.force.clone().multiplyScalar(pfCoefs[i]);
        const s = pointLocalVec[i].clone().applyQuaternion(q);
        f.cross(s);
        prev.add(f);
        return prev;
      }, new Vector3())
      .add(ma.clone().cross(cogQ));

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
    pfs.forEach((pf, i) => {
      phi_q.set(row + X, pf.col + X, pfCoefs[i]);
      phi_q.set(row + Y, pf.col + Y, pfCoefs[i]);
      phi_q.set(row + Z, pf.col + Z, pfCoefs[i]);
    });
    // dω
    const dOmega = getDeltaOmega(
      vO,
      omega,
      omegaSkew,
      pCog,
      cogSkewP,
      this.mass
    ).mmul(unitZ); // (3x1)
    phi_q.setSubMatrix(dOmega, row, colOmega);

    // dP
    const dP = omegaSkew2.mul(this.mass);
    phi_q.setSubMatrix(dP, row, col + X);
    // dΘ
    const dThetaMCF = omegaSkew2.mmul(A).mmul(cogLocalSkew).mul(this.mass);
    phi_q.setSubMatrix(dThetaMCF.mmul(G), row, col + Q0);

    // モーメントの部分のヤコビアン
    let dThetaM = new Matrix(3, 3);
    pfs.forEach((pf, i) => {
      // dF
      const Ari = pointLocalVec[i]
        .applyQuaternion(q)
        .multiplyScalar(-pfCoefs[i]);
      phi_q.setSubMatrix(skew(Ari), row + 3, pf.col + X);
      // theta部分の微分
      const fSkew = skew(pf.force.clone().multiplyScalar(pfCoefs[i]));
      const As = A.mmul(pointLocalSkew[i]);
      dThetaM = dThetaM.add(fSkew.mmul(As));
    });
    // dP
    const dPRot = cogSkewQ.mmul(omegaSkew2).mul(-this.mass);
    phi_q.setSubMatrix(dPRot, row + 3, col + X);

    // dΘ
    dThetaM = dThetaM.add(maSkew.mmul(A).mmul(cogLocalSkew)); // (3x3) x (3x3) x (3x3) x (3x4) = 3x4
    dThetaM = dThetaM.add(cogSkewQ.mmul(dThetaMCF).mul(-1));
    phi_q.setSubMatrix(dThetaM.mmul(G), row + 3, col + Q0);

    // dω
    const dOmegaRot = cogSkewQ.mmul(dOmega).mul(-1);
    phi_q.setSubMatrix(dOmegaRot, row + 3, colOmega);
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}

export class BarBalance implements Constraint {
  readonly className = 'BarBalance';

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

  pfs: Twin<PointForce>;

  components: Twin<IComponent>;

  get lhs() {
    return this.components[0];
  }

  get rhs() {
    return this.components[1];
  }

  localVec: Twin<Vector3>;

  localSkew: Twin<Matrix>;

  cog: number;

  g: Vector3 = new Vector3(0, 0, -9.81);

  mass: number;

  vO: () => Vector3;

  omega: GeneralVariable;

  constructor(params: {
    name: string;
    components: Twin<IComponent>;
    points: Twin<Vector3>;
    mass: number;
    cog: number; // lhs基準
    pfs: Twin<PointForce>;
    vO: () => Vector3; // 座標原点の速度
    omega: GeneralVariable; // 座標原点の角速度
  }) {
    this.name = params.name;
    if (params.components[0] === params.components[1])
      throw new Error('コンポーネントは別である必要がある');
    this.components = [...params.components];
    this.cog = params.cog;
    this.pfs = [...params.pfs];
    this.mass = params.mass;
    this.vO = params.vO;
    this.omega = params.omega;
    this.localVec = params.points.map((p) => p.clone()) as any;
    this.localSkew = this.localVec.map((v) => skew(v).mul(2)) as any;
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row, components, localVec, localSkew, pfs, g, cog} = this;

    const pts = components.map((c, i) =>
      localVec[i].clone().applyQuaternion(c.quaternion).add(c.position)
    );
    const pCog = pts[1].clone().sub(pts[0]).multiplyScalar(cog).add(pts[0]);
    const cogSkewP = skew(pCog);

    const omega = new Vector3(0, 0, this.omega.value);
    const omegaSkew = skew(omega); // 角速度のSkewMatrix
    const omegaSkew2 = omegaSkew.mmul(omegaSkew);
    const vO = this.vO(); // 車速
    const cO = omega.clone().cross(vO); // 車両座標系にかかる原点の遠心力

    const c = omega.clone().cross(omega.clone().cross(pCog)).add(cO);
    const ma = g.clone().add(c).multiplyScalar(this.mass); // 遠心力＋重力
    const maSkew = skew(ma);

    const translation = pfs
      .reduce((prev, f) => prev.add(f.force), new Vector3())
      .add(ma);
    // 変分の方程式がわかりやすくなるようにあえて、力x距離にする
    // グローバル座標系原点周りのモーメントつり合い
    const rotation = pfs
      .reduce(
        (prev, f, i) => prev.add(f.force.clone().cross(pts[i])),
        new Vector3()
      )
      .add(ma.clone().cross(pCog));

    phi[row + 0] = translation.x;
    phi[row + 1] = translation.y;
    phi[row + 2] = translation.z;
    phi[row + 3] = rotation.x;
    phi[row + 4] = rotation.y;
    phi[row + 5] = rotation.z;

    pfs.forEach((pf, i) => {
      const t = i + (1 + -2 * i) * cog;
      const pfCol = pf.col;
      const fSkew = skew(pf.force);
      const c = components[i];
      // 力
      phi_q.set(row + X, pfCol + X, 1);
      phi_q.set(row + Y, pfCol + Y, 1);
      phi_q.set(row + Z, pfCol + Z, 1);
      const deltaP = omegaSkew2.mul(t * this.mass);
      phi_q.setSubMatrix(deltaP, row, c.col + X);

      // モーメント
      phi_q.setSubMatrix(skew(pts[i]).mul(-1), row + 3, pfCol + X);
      const deltaP2 = fSkew.add(maSkew.sub(omegaSkew2).mul(this.mass * t));
      phi_q.setSubMatrix(deltaP2, row + 3, c.col + X);

      if (isFullDegreesComponent(c)) {
        // 力
        const A = rotationMatrix(c.quaternion);
        const G = decompositionMatrixG(c.quaternion);
        phi_q.setSubMatrix(
          deltaP.mmul(A.mmul(localSkew[i]).mmul(G)),
          row,
          c.col + Q0
        );
        // モーメント
        phi_q.setSubMatrix(
          deltaP2.mmul(A.mmul(localSkew[i]).mmul(G)),
          row + 3,
          c.col + Q0
        );
      }
    });
    const colOmega = this.omega.col;
    // 力のつり合い(ω部分)
    const dOmega = getDeltaOmega(
      vO,
      omega,
      omegaSkew,
      pCog,
      cogSkewP,
      this.mass
    ).mmul(unitZ); // (3x1)
    phi_q.setSubMatrix(dOmega, row, colOmega);
    // モーメントのつり合い(ω部分)
    const dOmegaRot = cogSkewP.mmul(dOmega).mul(-1);
    phi_q.setSubMatrix(dOmegaRot, row + 3, colOmega);
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}

export class AArmBalance implements Constraint {
  readonly className = 'AArmBalance';

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

  pfs: Triple<PointForce>;

  components: Triple<IComponent>;

  get lhs() {
    return this.components[0];
  }

  get rhs() {
    return this.components[1];
  }

  localVec: Triple<Vector3>;

  localSkew: Triple<Matrix>;

  cog: Triple<number>;

  g: Vector3 = new Vector3(0, 0, -9.81);

  mass: number;

  vO: () => Vector3;

  omega: GeneralVariable;

  constructor(params: {
    name: string;
    components: Triple<IComponent>;
    points: Triple<Vector3>;
    mass: number;
    cog: Vector3;
    pfs: Triple<PointForce>;
    vO: () => Vector3; // 座標原点の速度
    omega: GeneralVariable; // 座標原点の角速度
  }) {
    this.name = params.name;
    this.cog = params.points.map(
      (p) => params.cog.dot(p) / p.lengthSq()
    ) as Triple<number>;
    this.pfs = [...params.pfs];
    this.components = [...params.components];
    this.mass = params.mass;
    this.vO = params.vO;
    this.omega = params.omega;
    this.localVec = params.points.map((p) => p.clone()) as Triple<Vector3>;
    this.localSkew = params.points.map((p) => skew(p)) as Triple<Matrix>;
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row, components, localVec, localSkew, pfs, cog, g} = this;

    const colDone: number[] = [];
    const pts = localVec.map((s, i) =>
      s.applyQuaternion(components[i].quaternion).add(components[i].position)
    );
    const pCog = cog.reduce(
      (prev, t, i) => prev.add(pts[i].clone().multiplyScalar(t)),
      new Vector3()
    );
    const cogSkewP = skew(pCog);

    const omega = new Vector3(0, 0, this.omega.value);
    const omegaSkew = skew(omega); // 角速度のSkewMatrix
    const omegaSkew2 = omegaSkew.mmul(omegaSkew);
    const vO = this.vO(); // 車速
    const cO = omega.clone().cross(vO); // 車両座標系にかかる原点の遠心力

    const c = omega.clone().cross(omega.clone().cross(pCog)).add(cO);
    const ma = g.clone().add(c).multiplyScalar(this.mass); // 遠心力＋重力
    const maSkew = skew(ma);

    const translation = pfs
      .reduce((prev, f) => prev.add(f.force), new Vector3())
      .add(ma);
    // 変分の方程式がわかりやすくなるようにあえて、力x距離にする
    // グローバル座標系原点周りのモーメントつり合い
    const rotation = pfs
      .reduce(
        (prev, f, i) => prev.add(f.force.clone().cross(pts[i])),
        new Vector3()
      )
      .add(ma.clone().cross(pCog));

    phi[row + 0] = translation.x;
    phi[row + 1] = translation.y;
    phi[row + 2] = translation.z;
    phi[row + 3] = rotation.x;
    phi[row + 4] = rotation.y;
    phi[row + 5] = rotation.z;

    pfs.forEach((pf, i) => {
      const t = cog[i];
      const pfCol = pf.col;
      const fSkew = skew(pf.force);
      const c = components[i];
      // 力
      phi_q.set(row + X, pfCol + X, 1);
      phi_q.set(row + Y, pfCol + Y, 1);
      phi_q.set(row + Z, pfCol + Z, 1);
      const deltaP = omegaSkew2.mul(t * this.mass);
      if (!colDone.includes(c.col)) {
        phi_q.setSubMatrix(deltaP, row, c.col + X);
      } else {
        phi_q.subMatrixAdd(deltaP, row, c.col + X);
      }

      // モーメント
      phi_q.setSubMatrix(skew(pts[i]).mul(-1), row + 3, pfCol + X);
      const deltaP2 = fSkew.add(maSkew.sub(omegaSkew2).mul(this.mass * t));
      if (!colDone.includes(c.col)) {
        phi_q.setSubMatrix(deltaP2, row + 3, c.col + X);
      } else {
        phi_q.subMatrixAdd(deltaP2, row + 3, c.col + X);
      }

      if (isFullDegreesComponent(c)) {
        const A = rotationMatrix(c.quaternion);
        const G = decompositionMatrixG(c.quaternion);
        if (!colDone.includes(c.col)) {
          // 力
          phi_q.setSubMatrix(
            deltaP.mmul(A.mmul(localSkew[i]).mmul(G)),
            row,
            c.col + Q0
          );
          // モーメント
          phi_q.setSubMatrix(
            deltaP2.mmul(A.mmul(localSkew[i]).mmul(G)),
            row + 3,
            c.col + Q0
          );
        } else {
          // 力
          phi_q.subMatrixAdd(
            deltaP.mmul(A.mmul(localSkew[i]).mmul(G)),
            row,
            c.col + Q0
          );
          // モーメント
          phi_q.subMatrixAdd(
            deltaP2.mmul(A.mmul(localSkew[i]).mmul(G)),
            row + 3,
            c.col + Q0
          );
        }
      }
      colDone.push(c.col);
    });
    const colOmega = this.omega.col;
    // 力のつり合い(ω部分)
    const dOmega = getDeltaOmega(
      vO,
      omega,
      omegaSkew,
      pCog,
      cogSkewP,
      this.mass
    ).mmul(unitZ); // (3x1)
    phi_q.setSubMatrix(dOmega, row, colOmega);
    // モーメントのつり合い(ω部分)
    const dOmegaRot = cogSkewP.mmul(dOmega).mul(-1);
    phi_q.setSubMatrix(dOmegaRot, row + 3, colOmega);
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}

export class LinearBushingBalance implements Constraint {
  readonly className = 'LinearBushingBalance';

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

  get lhs() {
    return this.frameComponent;
  }

  get rhs() {
    return this.rodEndComponents[0];
  }

  frameLocalVec: Twin<Vector3>;

  frameLocalSkew: Twin<Matrix>;

  rodEndLocalVec: OneOrTwo<Vector3>;

  rodEndLocalSkew: OneOrTwo<Matrix>;

  cogLocalVec: Vector3;

  cogLocalSkew: Matrix;

  g: Vector3 = new Vector3(0, 0, -9.81);

  mass: number;

  vO: () => Vector3;

  omega: GeneralVariable;

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
    vO: () => Vector3; // 座標原点の速度
    omega: GeneralVariable; // 座標原点の角速度
  }) {
    this.name = params.name;
    this.cogLocalVec = params.cog.clone();
    this.cogLocalSkew = skew(this.cogLocalVec).mul(2);
    this.pfsFrame = [...params.pfsFrame];
    this.pfsRodEnd = [...params.pfsRodEnd];
    this.frameComponent = params.frameComponent;
    this.rodEndComponents = [...params.rodEndComponents];
    if (this.rodEndComponents[0] === this.rodEndComponents[1])
      throw new Error('RodEndの両端は別のコンポーネントと接続する必要あり');
    this.mass = params.mass;
    this.vO = params.vO;
    this.omega = params.omega;
    this.frameLocalVec = params.framePoints.map((p) =>
      p.clone()
    ) as Twin<Vector3>;
    this.frameLocalSkew = params.framePoints.map((p) =>
      skew(p)
    ) as Twin<Matrix>;
    this.rodEndLocalVec = params.rodEndPoints.map((p) =>
      p.clone()
    ) as OneOrTwo<Vector3>;
    this.rodEndLocalSkew = params.rodEndPoints.map((p) =>
      skew(p)
    ) as OneOrTwo<Matrix>;
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {
      row,
      rodEndLocalVec,
      rodEndLocalSkew,
      frameLocalVec,
      frameLocalSkew,
      pfsFrame,
      pfsRodEnd,
      cogLocalVec,
      cogLocalSkew,
      g
    } = this;

    const cRs = this.rodEndComponents;
    const cF = this.frameComponent;
    const ptsFrame = frameLocalVec.map((s) =>
      s.applyQuaternion(cF.quaternion).add(cF.position)
    );
    const ptsRodEnd = rodEndLocalVec.map((s, i) =>
      s.applyQuaternion(cRs[i].quaternion).add(cRs[i].position)
    );
    const pCog = cogLocalVec.applyQuaternion(cF.quaternion).add(cF.position);
    const cogSkewP = skew(pCog);

    const omega = new Vector3(0, 0, this.omega.value);
    const omegaSkew = skew(omega); // 角速度のSkewMatrix
    const omegaSkew2 = omegaSkew.mmul(omegaSkew);
    const vO = this.vO(); // 車速
    const cO = omega.clone().cross(vO); // 車両座標系にかかる原点の遠心力

    const c = omega.clone().cross(omega.clone().cross(pCog)).add(cO);
    const ma = g.clone().add(c).multiplyScalar(this.mass); // 遠心力＋重力
    const maSkew = skew(ma);

    const translation = pfsFrame
      .reduce((prev, f) => prev.add(f.force), new Vector3())
      .add(pfsRodEnd.reduce((prev, f) => prev.add(f.force), new Vector3()))
      .add(ma);

    // 変分の方程式がわかりやすくなるようにあえて、力x距離にする
    // グローバル座標系原点周りのモーメントつり合い
    const rotation = pfsFrame
      .reduce(
        (prev, f, i) => prev.add(f.force.clone().cross(ptsFrame[i])),
        new Vector3()
      )
      .add(
        pfsRodEnd.reduce(
          (prev, f, i) => prev.add(f.force.clone().cross(ptsRodEnd[i])),
          new Vector3()
        )
      )
      .add(ma.clone().cross(pCog));

    phi[row + 0] = translation.x;
    phi[row + 1] = translation.y;
    phi[row + 2] = translation.z;
    phi[row + 3] = rotation.x;
    phi[row + 4] = rotation.y;
    phi[row + 5] = rotation.z;

    // 力のつり合いのヤコビアン
    const Af = rotationMatrix(cF.quaternion);
    const Gf = decompositionMatrixG(cF.quaternion);
    // Frame dP(遠心力)
    const dPF = omegaSkew2.mul(this.mass);
    phi_q.setSubMatrix(dPF, row, cF.col + X);
    // Frame dΘ(遠心力)
    const dThetaFM = dPF.mmul(Af).mmul(cogLocalSkew);
    phi_q.setSubMatrix(dThetaFM.mmul(Gf), row, cF.col + X);

    // dω
    const colOmega = this.omega.col;
    const dOmega = getDeltaOmega(
      vO,
      omega,
      omegaSkew,
      pCog,
      cogSkewP,
      this.mass
    ).mmul(unitZ); // (3x1)
    phi_q.setSubMatrix(dOmega, row, colOmega);

    // dPf Frame
    pfsFrame.forEach((pf) => {
      phi_q.set(row + X, pf.col + X, 1);
      phi_q.set(row + Y, pf.col + Y, 1);
      phi_q.set(row + Z, pf.col + Z, 1);
    });
    // dPf RodEnd
    pfsRodEnd.forEach((pf) => {
      phi_q.set(row + X, pf.col + X, 1);
      phi_q.set(row + Y, pf.col + Y, 1);
      phi_q.set(row + Z, pf.col + Z, 1);
    });

    // モーメントのつり合いのヤコビアン
    // Frame dP, dΘ
    let dPFRot = new Matrix(3, 3);
    let dThetaFRotM = new Matrix(3, 3);
    pfsFrame.forEach((pf, i) => {
      const fSkew = skew(pf.force);
      dPFRot = dPFRot.add(fSkew);
      dThetaFRotM = dThetaFRotM.add(fSkew.mmul(Af).mmul(frameLocalSkew[i]));
    });
    dPFRot = dPFRot.sub(cogSkewP.mmul(dPF));
    dThetaFRotM = dThetaFRotM.add(maSkew.mmul(Af).mmul(cogLocalSkew));
    dThetaFRotM = dThetaFRotM.sub(cogSkewP.mmul(dThetaFM));

    phi_q.setSubMatrix(dPFRot, row + 3, cF.col + X);
    phi_q.setSubMatrix(dThetaFRotM.mmul(Gf), row + 3, cF.col + X);

    // RodEnd dP, dΘ
    pfsRodEnd.forEach((pf, i) => {
      const fSkew = skew(pf.force);
      phi_q.setSubMatrix(fSkew, row + 3, cRs[i].col + X);
      if (isFullDegreesComponent(cRs[i])) {
        const Ar = rotationMatrix(cRs[i].quaternion);
        const Gr = decompositionMatrixG(cRs[i].quaternion);
        const dThetaR = fSkew.mmul(Ar).mmul(rodEndLocalSkew[i]).mmul(Gr);
        phi_q.setSubMatrix(dThetaR, row + 3, cRs[i].col + X);
      }
    });

    // dFFrame
    ptsFrame.forEach((p, i) => {
      phi_q.setSubMatrix(
        skew(p.multiplyScalar(-1)),
        row + 3,
        pfsFrame[i].col + X
      );
    });
    // dFFrame
    ptsRodEnd.forEach((p, i) => {
      phi_q.setSubMatrix(
        skew(p.multiplyScalar(-1)),
        row + 3,
        pfsRodEnd[i].col + X
      );
    });
    // dOmega
    const dOmegaRot = cogSkewP.mmul(dOmega).mul(-1);
    phi_q.setSubMatrix(dOmegaRot, row + 3, colOmega);
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}

export class TireBalance implements Constraint {
  readonly className = 'TireBalance';

  // 並進運動+回転
  constraints() {
    return 5;
  }

  active() {
    return true;
  }

  resetStates(): void {}

  readonly isInequalityConstraint = false;

  row: number = -1;

  name: string;

  pfs: Twin<PointForce>;

  error: GeneralVariable;

  component: IComponent;

  get lhs() {
    return this.component;
  }

  get rhs() {
    return this.component;
  }

  localVec: Twin<Vector3>;

  localSkew: Twin<Matrix>;

  cog: number;

  g: Vector3 = new Vector3(0, 0, -9.81);

  mass: number;

  vO: () => Vector3;

  omega: GeneralVariable;

  ground: () => Vector3;

  getFriction: (sa: number, ia: number, fz: number) => Vector3;

  torqueRatio: number; // 駆動輪の駆動力配分

  localAxis: Vector3;

  localAxisSkew: Matrix;

  pfCoefs: Twin<number>; // ジョイント部分を作用反作用どちらで使うか

  constructor(params: {
    name: string;
    component: FullDegreesComponent;
    points: Twin<Vector3>; // Component基準
    mass: number;
    cog: number;
    pfs: Twin<PointForce>; // Bearing部分
    pfsPointNodeIDs: Twin<string>; // ジョイント部分のローカルベクトルのノードID 作用反作用で定義
    vO: () => Vector3; // 座標原点の速度
    omega: GeneralVariable; // 座標原点の角速度
    torqueRatio: number;
    getFriction: (sa: number, ia: number, fz: number) => Vector3; // タイヤの発生する力
    error: GeneralVariable;
    ground: () => Vector3; // コンポーネント座標系における接地点
  }) {
    const {
      name,
      component,
      mass,
      cog,
      points, // Component基準
      pfs, // Bearing部分
      error,
      torqueRatio,
      vO,
      ground,
      getFriction, // タイヤの発生する力
      omega // 座標原点の角速度
    } = params;

    this.name = name;
    this.cog = cog;
    this.pfs = [...pfs];
    this.pfCoefs = this.pfs.map((pf, i) =>
      pf.sign(params.pfsPointNodeIDs[i])
    ) as Twin<number>;
    this.error = error;
    this.component = component;
    this.mass = mass;
    this.torqueRatio = torqueRatio;
    this.omega = omega;
    this.getFriction = getFriction;
    this.vO = vO;
    this.ground = ground;
    this.localVec = points.map((p) => p.clone()) as Twin<Vector3>;
    this.localSkew = points.map((p) => skew(p).mul(-2)) as Twin<Matrix>;

    this.localAxis = this.localVec[1].clone().sub(this.localVec[0]).normalize();
    this.localAxisSkew = skew(this.localAxis).mul(-2);
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row, localVec, localSkew, pfs, cog, g, error, torqueRatio} = this;
    const {component, localAxis, localAxisSkew, pfCoefs} = this;

    const q = this.component.quaternion;
    const {position} = this.component;
    const pQ = localVec.map((p) => p.applyQuaternion(q));
    const pSkewQ = pQ.map((p) => skew(p));
    // 接地点
    const ground = this.ground();
    const localGroundSkew = skew(ground).mul(-2);
    const groundQ = this.ground().clone().applyQuaternion(q);
    const groundSkewQ = skew(groundQ);

    // 重心
    const localCog = localVec[1]
      .clone()
      .sub(localVec[0])
      .multiplyScalar(cog)
      .add(localVec[0]);
    const pCogQ = localCog.clone().applyQuaternion(q);
    const pCog = pCogQ.clone().add(position); // 車両座標系
    const cogSkewP = skew(pCog);
    const cogSkewQ = skew(pCogQ);
    const cogLocalSkew = skew(localCog).mul(-2);
    // 慣性力
    const omega = new Vector3(0, 0, this.omega.value);
    const omegaSkew = skew(omega); // 角速度のSkewMatrix
    const omegaSkew2 = omegaSkew.mmul(omegaSkew);
    const vO = this.vO(); // 車速(m/s)
    const cO = omega.clone().cross(vO); // 車両座標系にかかる原点の遠心力

    const c = omega.clone().cross(omega.clone().cross(pCog)).add(cO);
    const ma = g.clone().add(c).multiplyScalar(this.mass); // 遠心力＋重力
    const maSkew = skew(ma);
    // 接地点の速度
    const vOmega = omega.clone().cross(groundQ.clone().add(position));
    const vGround = vO.clone().add(vOmega);
    vGround.z = 0; // 念のため

    // SAとIAとFZを求める
    const axis = localAxis.clone().applyQuaternion(q);
    // axisに垂直で地面に平行なベクトル(Vの方向を向いている)
    const parallel = axis.clone().cross(normal).normalize();
    if (parallel.dot(vGround) < 0) parallel.multiplyScalar(-1);
    // saの取得
    const saSin = parallel.clone().cross(vGround.clone().normalize());
    const sa = (Math.asin(saSin.z) * 180) / Math.PI;

    // iaの取得
    const tireVirtical = axis.clone().cross(parallel).normalize();
    const iaSin = tireVirtical.cross(normal);
    const iaSign = iaSin.dot(parallel) > 0 ? 1 : -1;
    const ia = (iaSin.length() * iaSign * 180) / Math.PI;

    // fzの取得
    // normal方向成分を求める
    const fz = pfs
      .reduce((prev, current, i) => {
        return prev.add(new Vector3(0, 0, -current.force.z * pfCoefs[i]));
      }, new Vector3())
      .add(new Vector3(0, 0, -ma.z));

    // タイヤの摩擦力の取得
    const friction = this.getFriction(sa, ia, fz.z); // この値はタイヤが垂直の時の座標系
    // 垂直方向を合わせたのち、前方方向を合わせる

    const [frictionRot, frictionRotMat] = getFrictionRotation(parallel);
    const f2 = frictionRotMat.mmul(getVVector(friction));
    friction.applyQuaternion(frictionRot);

    // friction.set(0, 0, 0);
    const frictionSkew = skew(friction);

    // 誤差項
    const fe = normal
      .clone()
      .cross(axis)
      .multiplyScalar(-torqueRatio * error.value);
    const feSkew = skew(fe);

    // 力のつり合い
    const translation = pfs
      .reduce(
        (prev, pf, i) => prev.add(pf.force.clone().multiplyScalar(pfCoefs[i])),
        new Vector3()
      )
      .add(ma)
      .add(fz)
      .add(friction)
      .add(fe);

    // 変分の方程式がわかりやすくなるようにあえて、力x距離にする
    // 部品原点まわりのモーメントつり合い
    const rotation = pfs
      .reduce(
        (prev, pf, i) =>
          prev.add(
            pf.force
              .clone()
              .multiplyScalar(pfCoefs[i])
              .cross(pQ[i])
              .add(new Vector3(0, 0, -pf.force.z * pfCoefs[i]).cross(groundQ))
          ),
        new Vector3()
      )
      .add(ma.clone().cross(pCogQ))
      .add(new Vector3(0, 0, -ma.z).cross(groundQ))
      .add(friction.clone().add(fe).cross(groundQ));

    phi[row + X] = translation.x;
    phi[row + Y] = translation.y;
    // phi[row + Z] = translation.z;
    phi[row + 2 + X] = rotation.x;
    phi[row + 2 + Y] = rotation.y;
    phi[row + 2 + Z] = rotation.z;

    // 力のつり合い
    const A = rotationMatrix(q);
    const G = decompositionMatrixG(q);
    // dF
    phi_q.set(row + X, pfs[0].col + X, -pfCoefs[0]);
    phi_q.set(row + Y, pfs[0].col + Y, -pfCoefs[0]);
    // phi_q.set(row + Z, pfs[0].col + Z, -pfCoefs[0]);
    phi_q.set(row + X, pfs[1].col + X, -pfCoefs[1]);
    phi_q.set(row + Y, pfs[1].col + Y, -pfCoefs[1]);
    // phi_q.set(row + Z, pfs[1].col + Z, -pfCoefs[1]);

    // dω
    const dOmega = getDeltaOmega(
      vO,
      omega,
      omegaSkew,
      pCog,
      cogSkewP,
      this.mass
    ).mmul(unitZ);
    phi_q.setSubMatrix(dOmega.subMatrix(0, 1, 0, 0), row, this.omega.col);
    // phi_q.setSubMatrix(dOmega, row, this.omega.col);

    // dP
    const dP = omegaSkew2.mul(this.mass);
    phi_q.setSubMatrix(dP.subMatrix(0, 1, 0, 2), row, component.col + X);
    // phi_q.setSubMatrix(dP, row, component.col + X);

    // dΘ
    let dThetaMF = omegaSkew2.mmul(A).mmul(cogLocalSkew).mul(this.mass);
    const dThetaMError = unitZSkew
      .mmul(A)
      .mmul(localAxisSkew)
      .mul(-torqueRatio * error.value);
    dThetaMF = dThetaMF.add(dThetaMError);
    const dTheta = dThetaMF.mmul(G);
    phi_q.setSubMatrix(dTheta.subMatrix(0, 1, 0, 3), row, component.col + Q0);
    // phi_q.setSubMatrix(dTheta, row, component.col + Q0);

    // de
    const de = unitZSkew.mmul(getVVector(axis)).mul(-torqueRatio);
    // phi_q.setSubMatrix(de.subMatrix(0, 1, 0, 0), row, error.col);
    // phi_q.setSubMatrix(de, row, error.col);

    // モーメントのつり合い
    // df
    pfs.forEach((pf, i) => {
      const a = groundSkewQ.mmul(unitZ);
      const dPf = pSkewQ[i].mul(-1).subMatrixAdd(a, 0, 2).mul(pfCoefs[i]);
      phi_q.setSubMatrix(dPf, row + 2, pf.col);
      // phi_q.setSubMatrix(dPf, row + 3, pf.col);
    });

    // dΘ
    let dThetaM = new Matrix(3, 3);
    pfs.forEach((pf, i) => {
      const fSkew = skew(pf.force).mul(pfCoefs[i]);
      dThetaM = dThetaM.add(fSkew.mmul(A).mmul(localSkew[i]));
      dThetaM = dThetaM.add(
        unitZSkew
          .mmul(A)
          .mmul(localGroundSkew)
          .mul(-pf.force.z * pfCoefs[i])
      );
    });
    dThetaM = dThetaM.add(maSkew.mmul(A).mmul(cogLocalSkew));
    dThetaM = dThetaM.add(
      frictionSkew.add(feSkew).mmul(A).mmul(localGroundSkew)
    );
    dThetaM = dThetaM.add(groundSkewQ.mmul(dThetaMError));
    const temp = groundSkewQ.mmul(unitZ).mmul(unitZ.transpose()).sub(cogSkewQ);
    const temp2 = temp.mmul(omegaSkew2).mul(this.mass);
    dThetaM = dThetaM.add(temp2.mmul(A).mmul(cogLocalSkew));
    phi_q.setSubMatrix(dThetaM.mmul(G), row + 2, component.col + Q0);
    // phi_q.setSubMatrix(dThetaM.mmul(G), row + 3, component.col + Q0);

    // dP
    phi_q.setSubMatrix(temp2, row + 2, component.col + X);
    // phi_q.setSubMatrix(temp2, row + 3, component.col + X);

    // dω
    phi_q.setSubMatrix(temp.mmul(dOmega), row + 2, this.omega.col);
    // phi_q.setSubMatrix(temp.mmul(dOmega), row + 3, this.omega.col);

    // de
    const de2 = groundSkewQ.mmul(de).mul(-1);
    // phi_q.setSubMatrix(de2, row + 2, this.error.col);
    // phi_q.setSubMatrix(de2, row + 3, this.error.col);
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}
