/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {Twin} from '@utils/atLeast';
import {IBar} from '@gd/IElements/IBar';
import {Constraint, ConstraintsOptions} from '@gd/kinematics/IConstraint';
import {
  skew,
  rotationMatrix,
  decompositionMatrixG,
  getDeltaOmega,
  normVectorDiff,
  normalizedVectorDiff,
  getVVector
} from '../KinematicFunctions';
import {
  IComponent,
  IVariable,
  isFullDegreesComponent,
  PointForce,
  GeneralVariable
} from '../KinematicComponents';
import {Balance} from '../SkidpadConstraints';

const X = 0;
const Q0 = 3;

const n = new Vector3(0, 0, 1);
const unitZ = getVVector(new Vector3(0, 0, 1));
const unitZT = unitZ.transpose();
const unitZSkew = skew(new Vector3(0, 0, 1));
const nnT = unitZ.mmul(unitZT);

export class BarBalance implements Constraint, Balance {
  static className = 'BarBalance' as const;

  readonly className = BarBalance.className;

  isBalance: true = true;

  isSpring: boolean = false;

  freeLength: number = 0;

  k: number = 0; // N/m

  setPreload() {
    const {pts, ma} = this.getCentrifugalForce();
    const u = pts[1].clone().sub(pts[0]);
    const {pfs, pfCoefs, k, t} = this;
    const length = u.length();
    const axis = u.normalize();
    // 地面に垂直でない成分は、完全に釣り合っているはず。
    const fn = pfs.map((pf) => n.clone().multiplyScalar(pf.force.dot(n)));
    const fxy = pfs.map((pf, i) => pf.force.clone().sub(fn[i]));
    const fl = fxy.map((f) => f.dot(f) / f.dot(axis));

    const dl = (fl[0] - fl[1]) / (2 * k);
    this.freeLength = length + dl;
  }

  // 並進運動+回転
  constraints(options: ConstraintsOptions) {
    if (this.isSpring && !options.disableSpringElasticity) return 6;
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

  element: IBar;

  t: number[];

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
    if (params.isSpring && params.k && params.k > 0) {
      this.isSpring = true;
      this.k = params.k;
    }
    this.element = params.element;
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
    this.t = this.pfs.map((_, i) => i + (1 + -2 * i) * this.cog);
  }

  getCentrifugalForce() {
    const {localVec, components, t} = this;
    const pts = components.map((c, i) =>
      localVec[i].clone().applyQuaternion(c.quaternion).add(c.position)
    );
    const pCog = pts.reduce(
      (prev, p, i) => prev.add(p.clone().multiplyScalar(t[i])),
      new Vector3()
    );
    const cogSkewP = skew(pCog);

    const omega = new Vector3(0, 0, this.omega.value);
    const vO = this.vO(); // 車速
    const cO = omega.clone().cross(vO).multiplyScalar(-1); // 車両座標系にかかる原点の遠心力

    const c = omega
      .clone()
      .cross(omega.clone().cross(pCog))
      .multiplyScalar(-1)
      .add(cO);

    const ma = this.g.clone().add(c).multiplyScalar(this.mass); // 遠心力＋重力
    return {
      vO,
      c,
      ma,
      omega,
      pCog,
      cogSkewP,
      pts
    };
  }

  setJacobianAndConstraints(
    phi_q: Matrix,
    phi: number[],
    options: ConstraintsOptions
  ) {
    const {row, components, localSkew, pfs, pfCoefs} = this;

    const {pts, omega, pCog, cogSkewP, vO, ma} = this.getCentrifugalForce();

    const omegaSkew = skew(omega); // 角速度のSkewMatrix
    const omegaSkew2 = omegaSkew.mmul(omegaSkew);
    const pSkewP = pts.map((p) => skew(p));
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
      const pfCol = pf.col;
      const fSkew = skew(pf.force.clone().multiplyScalar(pfCoefs[i]));
      const c = components[i];
      const t = this.t[i];

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

    if (this.isSpring && !options.disableSpringElasticity) {
      const I = Matrix.eye(3, 3);
      const u = pts[1].clone().sub(pts[0]);
      const A = components.map((c) => {
        if (isFullDegreesComponent(c)) {
          const A = rotationMatrix(c.quaternion);
          return A;
        }
        return null;
      });
      const G = components.map((c) => {
        if (isFullDegreesComponent(c)) {
          const G = decompositionMatrixG(c.quaternion);
          return G;
        }
        return null;
      });
      const du_dP = pts.map((p, i) => {
        return I.clone().mul(-1 * i);
      });
      const du_dTheta = pts.map((p, i) => {
        return A[i]?.mmul(localSkew[i]).mul(-1 * i);
      });
      const {pfs, pfCoefs, k, t} = this;

      const l = u.length();
      const dl_du = normVectorDiff(u);
      const dl_dP = du_dP.map((du_dP) => dl_du.mmul(du_dP));
      const dl_dTheta = du_dTheta.map((du_dTheta) =>
        du_dTheta ? dl_du.mmul(du_dTheta) : undefined
      );
      const ideal = this.k * (this.freeLength - l);
      const dIdeal_dP = dl_dP.map((dl_dP) => dl_dP.clone().mul(-this.k));
      const dIdeal_dTheta = dl_dTheta.map((dl_dTheta) =>
        dl_dTheta ? dl_dTheta.clone().mul(-this.k) : undefined
      );

      const axis = u.normalize();
      const dAxis_du = normalizedVectorDiff(u);
      const dAxis_dP = du_dP.map((du_dP) => dAxis_du.mmul(du_dP));
      const dAxis_dTheta = du_dTheta.map((du_dTheta) =>
        du_dTheta ? dAxis_du.mmul(du_dTheta) : undefined
      );

      const f0 = pfs[0].force.clone().multiplyScalar(pfCoefs[0]);
      const f = f0.sub(n.clone().multiplyScalar(f0.dot(n)));
      const df_df0 = I.clone().sub(nnT).mul(pfCoefs[0]);

      // 現在の軸方向の力の大きさ (|f| / cos(Θ) ) = |f|^2 / f・ax
      const fdotAx = f.dot(axis);
      const f2 = f.dot(f);
      const fl = f2 / fdotAx;
      // d_fl = {d(f^2)*fdotAx - f^2*d(f・ax)} / (f・ax)^2
      // なので、構成要素を求める。
      const df2_df = getVVector(f).transpose().mul(2); // (1x3);
      const dfDotAx_df = getVVector(axis).transpose(); // (1x3);
      const dFDotAx_dAxis = getVVector(f).transpose(); // (1x3);

      const dfl_df = df2_df
        .clone()
        .mul(fdotAx)
        .sub(dfDotAx_df.clone().mul(f2))
        .mul(1 / fdotAx ** 2);
      const dfl_dAxis = dFDotAx_dAxis.clone().mul(-f2 / fdotAx ** 2);
      const dfl_df0 = dfl_df.mmul(df_df0);
      const dfl_dP = dAxis_dP.map((dAxis_dP) => dfl_dAxis.mmul(dAxis_dP));
      const dfl_dTheta = dAxis_dTheta.map((dAxis_dTheta) =>
        dAxis_dTheta ? dfl_dAxis.mmul(dAxis_dTheta) : undefined
      );

      phi[row + 6] = fl - ideal;
      // 力のつり合い
      phi_q.subMatrixAdd(dfl_df0, row + 6, pfs[0].col);
      components.forEach((c, i) => {
        // dP
        const dP = dfl_dP[i].clone().sub(dIdeal_dP[i]);
        phi_q.subMatrixAdd(dfl_df0, row + 6, c.col + X);

        if (isFullDegreesComponent(c)) {
          // dQ
          const dTheta = dfl_dTheta[i]!.clone().sub(dIdeal_dTheta[i]!);
          const dQ = dTheta.mmul(G[i]!);
          phi_q.subMatrixAdd(dQ, row + 6, c.col + Q0);
        }
      });
    }
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }

  applytoElement() {
    const q = this.element.rotation.value.invert();
    const {c} = this.getCentrifugalForce();
    const {element} = this;

    element.fixedPointForce = this.pfs[0].force
      .clone()
      .multiplyScalar(this.pfCoefs[0])
      .applyQuaternion(q);

    element.pointForce = this.pfs[1].force
      .clone()
      .multiplyScalar(this.pfCoefs[1])
      .applyQuaternion(q);
    element.centrifugalForce = c
      .clone()
      .multiplyScalar(this.mass)
      .applyQuaternion(q);
    element.gravity = this.g
      .clone()
      .multiplyScalar(this.mass)
      .applyQuaternion(q);
  }
}

export function isBarBalance(c: Constraint): c is BarBalance {
  return c.className === BarBalance.className;
}
