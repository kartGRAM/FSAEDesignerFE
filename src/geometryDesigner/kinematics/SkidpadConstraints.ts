/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {Triple, Twin, OneOrTwo} from '@utils/atLeast';
import {IElement} from '@gd/IElements';
import {
  skew,
  rotationMatrix,
  decompositionMatrixG,
  getDeltaOmega,
  getVVector
} from './KinematicFunctions';
import {
  IComponent,
  IVariable,
  FullDegreesComponent,
  isFullDegreesComponent,
  PointForce,
  GeneralVariable
} from './KinematicComponents';
import {Constraint} from './Constraints';
import {TireBalance, isTireBalance} from './SkidpadConstraints/TireBalance';
import {FDComponentBalance} from './SkidpadConstraints/FDComponentBalance';

const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;

const unitZ = getVVector(new Vector3(0, 0, 1));
const unitZT = unitZ.transpose();

export interface Balance {
  applytoElement(): void;
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

  relevantVariables: IVariable[];

  localVec: Twin<Vector3>;

  localSkew: Twin<Matrix>;

  cog: number;

  g: Vector3;

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
    this.omega = params.omega;
    this.g = new Vector3(0, 0, -9810 * this.components[0].scale);

    this.relevantVariables = [...this.components, this.omega, ...this.pfs];
    this.mass = params.mass;
    this.vO = params.vO;
    const {scale} = this.components[0];
    this.localVec = params.points.map((p) =>
      p.clone().multiplyScalar(scale)
    ) as any;
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
      const deltaP = omegaSkew2.clone().mul(t * this.mass);
      phi_q.subMatrixAdd(deltaP, row, c.col + X);

      // モーメント
      phi_q.subMatrixAdd(skew(pts[i]).mul(-1), row + 3, pfCol + X);
      const deltaP2 = fSkew.add(
        maSkew
          .clone()
          .sub(omegaSkew2)
          .mul(this.mass * t)
      );
      phi_q.subMatrixAdd(deltaP2, row + 3, c.col + X);

      if (isFullDegreesComponent(c)) {
        // 力
        const A = rotationMatrix(c.quaternion);
        const G = decompositionMatrixG(c.quaternion);
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
    phi_q.subMatrixAdd(dOmega, row, colOmega);
    // モーメントのつり合い(ω部分)
    const dOmegaRot = cogSkewP.mmul(dOmega).mul(-1);
    phi_q.subMatrixAdd(dOmegaRot, row + 3, colOmega);
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

  relevantVariables: IVariable[];

  localVec: Triple<Vector3>;

  localSkew: Triple<Matrix>;

  cog: Triple<number>;

  g: Vector3;

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
    this.omega = params.omega;
    this.g = new Vector3(0, 0, -9810 * this.components[0].scale);
    this.relevantVariables = [...this.components, this.omega, ...this.pfs];
    this.mass = params.mass;
    this.vO = params.vO;
    const {scale} = this.components[0];
    this.localVec = params.points.map((p) =>
      p.clone().multiplyScalar(scale)
    ) as Triple<Vector3>;
    this.localSkew = this.localVec.map((p) =>
      skew(p).mul(-2)
    ) as Triple<Matrix>;
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row, components, localVec, localSkew, pfs, cog, g} = this;

    const colDone: number[] = [];
    const pts = localVec.map((s, i) =>
      s
        .clone()
        .applyQuaternion(components[i].quaternion)
        .add(components[i].position)
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
      const deltaP = omegaSkew2.clone().mul(t * this.mass);
      if (!colDone.includes(c.col)) {
        phi_q.subMatrixAdd(deltaP, row, c.col + X);
      } else {
        phi_q.subMatrixAdd(deltaP, row, c.col + X);
      }

      // モーメント
      phi_q.subMatrixAdd(skew(pts[i]).mul(-1), row + 3, pfCol + X);
      const deltaP2 = fSkew.add(
        maSkew
          .clone()
          .sub(omegaSkew2)
          .mul(this.mass * t)
      );
      if (!colDone.includes(c.col)) {
        phi_q.subMatrixAdd(deltaP2, row + 3, c.col + X);
      } else {
        phi_q.subMatrixAdd(deltaP2, row + 3, c.col + X);
      }

      if (isFullDegreesComponent(c)) {
        const A = rotationMatrix(c.quaternion);
        const G = decompositionMatrixG(c.quaternion);
        if (!colDone.includes(c.col)) {
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
    phi_q.subMatrixAdd(dOmega, row, colOmega);
    // モーメントのつり合い(ω部分)
    const dOmegaRot = cogSkewP.mmul(dOmega).mul(-1);
    phi_q.subMatrixAdd(dOmegaRot, row + 3, colOmega);
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

  relevantVariables: IVariable[];

  frameLocalVec: Twin<Vector3>;

  frameLocalSkew: Twin<Matrix>;

  rodEndLocalVec: OneOrTwo<Vector3>;

  rodEndLocalSkew: OneOrTwo<Matrix>;

  cogLocalVec: Vector3;

  cogLocalSkew: Matrix;

  g: Vector3;

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
    this.pfsFrame = [...params.pfsFrame];
    this.pfsRodEnd = [...params.pfsRodEnd];
    this.frameComponent = params.frameComponent;
    const {scale} = this.frameComponent;
    this.rodEndComponents = [...params.rodEndComponents];
    if (this.rodEndComponents[0] === this.rodEndComponents[1])
      throw new Error('RodEndの両端は別のコンポーネントと接続する必要あり');
    this.mass = params.mass;
    this.vO = params.vO;
    this.omega = params.omega;
    this.g = new Vector3(0, 0, -9810 * this.frameComponent.scale);

    this.relevantVariables = [
      this.frameComponent,
      ...this.rodEndComponents,
      this.omega,
      ...this.pfsFrame,
      ...this.pfsRodEnd
    ];
    this.cogLocalVec = params.cog.clone().multiplyScalar(scale);
    this.cogLocalSkew = skew(this.cogLocalVec).mul(2);
    this.frameLocalVec = params.framePoints.map((p) =>
      p.clone().multiplyScalar(scale)
    ) as Twin<Vector3>;
    this.frameLocalSkew = this.frameLocalVec.map((p) =>
      skew(p)
    ) as Twin<Matrix>;
    this.rodEndLocalVec = params.rodEndPoints.map((p) =>
      p.clone().multiplyScalar(scale)
    ) as OneOrTwo<Vector3>;
    this.rodEndLocalSkew = this.rodEndLocalVec.map((p) =>
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
      s.clone().applyQuaternion(cF.quaternion).add(cF.position)
    );
    const ptsRodEnd = rodEndLocalVec.map((s, i) =>
      s.clone().applyQuaternion(cRs[i].quaternion).add(cRs[i].position)
    );
    const pCog = cogLocalVec
      .clone()
      .applyQuaternion(cF.quaternion)
      .add(cF.position);
    const cogSkewP = skew(pCog);

    const omega = new Vector3(0, 0, this.omega.value);
    const omegaSkew = skew(omega); // 角速度のSkewMatrix
    const omegaSkew2 = omegaSkew.mmul(omegaSkew);
    const vO = this.vO(); // 車速
    const cO = omega.clone().cross(vO).multiplyScalar(-1); // 車両座標系にかかる原点の遠心力

    const c = omega
      .clone()
      .cross(omega.clone().cross(pCog))
      .multiplyScalar(-1)
      .add(cO);
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
    const dPF = omegaSkew2.clone().mul(this.mass);
    phi_q.subMatrixAdd(dPF, row, cF.col + X);
    // Frame dΘ(遠心力)
    const dThetaFM = dPF.mmul(Af).mmul(cogLocalSkew);
    phi_q.subMatrixAdd(dThetaFM.mmul(Gf), row, cF.col + X);

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
    phi_q.subMatrixAdd(dOmega, row, colOmega);

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

    phi_q.subMatrixAdd(dPFRot, row + 3, cF.col + X);
    phi_q.subMatrixAdd(dThetaFRotM.mmul(Gf), row + 3, cF.col + X);

    // RodEnd dP, dΘ
    pfsRodEnd.forEach((pf, i) => {
      const fSkew = skew(pf.force);
      phi_q.subMatrixAdd(fSkew, row + 3, cRs[i].col + X);
      if (isFullDegreesComponent(cRs[i])) {
        const Ar = rotationMatrix(cRs[i].quaternion);
        const Gr = decompositionMatrixG(cRs[i].quaternion);
        const dThetaR = fSkew.mmul(Ar).mmul(rodEndLocalSkew[i]).mmul(Gr);
        phi_q.subMatrixAdd(dThetaR, row + 3, cRs[i].col + X);
      }
    });

    // dFFrame
    ptsFrame.forEach((p, i) => {
      phi_q.subMatrixAdd(
        skew(p.clone().multiplyScalar(-1)),
        row + 3,
        pfsFrame[i].col + X
      );
    });
    // dFFrame
    ptsRodEnd.forEach((p, i) => {
      phi_q.subMatrixAdd(
        skew(p.clone().multiplyScalar(-1)),
        row + 3,
        pfsRodEnd[i].col + X
      );
    });
    // dOmega
    const dOmegaRot = cogSkewP.mmul(dOmega).mul(-1);
    phi_q.subMatrixAdd(dOmegaRot, row + 3, colOmega);
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}

export {TireBalance, isTireBalance};
export {FDComponentBalance};
