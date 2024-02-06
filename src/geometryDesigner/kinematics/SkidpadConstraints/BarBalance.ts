/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {Twin} from '@utils/atLeast';
import {IBar} from '@gd/IElements/IBar';
import {
  skew,
  rotationMatrix,
  decompositionMatrixG,
  getDeltaOmega,
  getVVector
} from '../KinematicFunctions';
import {
  IComponent,
  IVariable,
  isFullDegreesComponent,
  PointForce,
  GeneralVariable
} from '../KinematicComponents';
import {Constraint} from '../Constraints';

const X = 0;
const Q0 = 3;

const unitZ = getVVector(new Vector3(0, 0, 1));

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

  pfCoefs: number[]; // ジョイント部分のローカルベクトルのノードID 作用反作用で定義

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
    pfsPointNodeIDs: string[]; // ジョイント部分のローカルベクトルのノードID 作用反作用どちらで使うかを判定する
    vO: () => Vector3; // 座標原点の速度
    omega: GeneralVariable; // 座標原点の角速度
  }) {
    this.name = params.name;
    if (params.components[0] === params.components[1])
      throw new Error('コンポーネントは別である必要がある');
    this.components = [...params.components];
    this.cog = params.cog;
    this.pfs = [...params.pfs];
    this.pfCoefs = this.pfs.map((pf, i) => pf.sign(params.pfsPointNodeIDs[i]));
    this.omega = params.omega;
    this.g = new Vector3(0, 0, -9810 * this.components[0].scale);

    this.relevantVariables = [...this.components, this.omega, ...this.pfs];
    this.mass = params.mass;
    this.vO = params.vO;
    const {scale} = this.components[0];
    this.localVec = params.points.map((p) =>
      p.clone().multiplyScalar(scale)
    ) as any;
    this.localSkew = this.localVec.map((v) => skew(v).mul(-2)) as any;
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row, components, localVec, localSkew, pfs, g, cog, pfCoefs} = this;

    const pts = components.map((c, i) =>
      localVec[i].clone().applyQuaternion(c.quaternion).add(c.position)
    );
    const pSkewP = pts.map((p) => skew(p));
    const pCog = pts[1].clone().sub(pts[0]).multiplyScalar(cog).add(pts[0]);
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

    const translation = pfs
      .reduce((prev, f, i) => {
        const pf = f.force.clone().multiplyScalar(pfCoefs[i]);
        return prev.add(pf);
      }, new Vector3())
      .add(ma);

    // グローバル座標系原点周りのモーメントつり合い
    // 変分の方程式がわかりやすくなるようにあえて、力x距離にする
    const rotation = pfs
      .reduce((prev, f, i) => {
        const pfm = f.force.clone().cross(pts[i]).multiplyScalar(pfCoefs[i]);
        return prev.add(pfm);
      }, new Vector3())
      .add(ma.clone().cross(pCog));

    phi[row + 0] = translation.x;
    phi[row + 1] = translation.y;
    phi[row + 2] = translation.z;
    phi[row + 3] = rotation.x;
    phi[row + 4] = rotation.y;
    phi[row + 5] = rotation.z;

    const I = Matrix.eye(3, 3);
    pfs.forEach((pf, i) => {
      const t = i + (1 + -2 * i) * cog;
      const pfCol = pf.col;
      const fSkew = skew(pf.force.clone().multiplyScalar(pfCoefs[i]));
      const c = components[i];

      // 力のつり合い
      // df
      const df1 = I.clone().mul(pfCoefs[i]);
      phi_q.subMatrixAdd(df1, row, pfCol + X);

      // dP
      const dP1 = omegaSkew2.clone().mul(-t * this.mass);
      phi_q.subMatrixAdd(dP1, row, c.col + X);

      // モーメントのつり合い
      // df
      phi_q.subMatrixAdd(
        pSkewP[i].clone().mul(-pfCoefs[i]),
        row + 3,
        pfCol + X
      );

      // dP
      const dP2 = fSkew
        .add(maSkew.clone().mul(t))
        .add(cogSkewP.mmul(dP1).mul(-1));
      phi_q.subMatrixAdd(dP2, row + 3, c.col + X);

      if (isFullDegreesComponent(c)) {
        const A = rotationMatrix(c.quaternion);
        const G = decompositionMatrixG(c.quaternion);

        // 力のつり合い(dQ)
        phi_q.subMatrixAdd(
          dP1.mmul(A).mmul(localSkew[i]).mmul(G),
          row,
          c.col + Q0
        );

        // モーメントのつり合い(dQ)
        /* const dQM2 = fSkew
          .add(maSkew.clone().mul(t))
          .mmul(A)
          .mmul(localSkew[i]);
        dQM2.add(cogSkewP.mmul(dP1).mmul(A).mmul(localSkew[i]).mul(-1)); */
        phi_q.subMatrixAdd(
          dP2.mmul(A).mmul(localSkew[i]).mmul(G),
          row + 3,
          c.col + Q0
        );
      }
    });
    const colOmega = this.omega.col;
    // 力のつり合い(ω部分)
    const dOmega1 = getDeltaOmega(
      vO,
      omega,
      omegaSkew,
      pCog,
      cogSkewP,
      this.mass
    ).mmul(unitZ); // (3x1)
    phi_q.subMatrixAdd(dOmega1, row, colOmega);
    // モーメントのつり合い(ω部分)
    const dOmega2 = cogSkewP.mmul(dOmega1).mul(-1);
    phi_q.subMatrixAdd(dOmega2, row + 3, colOmega);
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}
