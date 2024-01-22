/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import {Matrix} from 'ml-matrix';
import {Vector3, Quaternion} from 'three';
import {Triple, Twin} from '@utils/atLeast';
import {
  skew,
  rotationMatrix,
  decompositionMatrixG,
  deltaXcross,
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
const Q3 = 6;
const unitZ = () => new Vector3(0, 0, 1);

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

  pointForceComponents: PointForce[];

  cogLocalVec: Vector3;

  cogLocalSkew: Matrix;

  pointLocalVec: Vector3[];

  pointLocalVecMat: Matrix[];

  pointLocalSkew: Matrix[];

  g: Vector3 = new Vector3(0, 0, -9.81);

  mass: number;

  vO: () => Vector3;

  omega: GeneralVariable;

  constructor(params: {
    name: string;
    component: FullDegreesComponent;
    mass: number;
    cog: Vector3;
    points: Vector3[];
    pointForceComponents: PointForce[];
    vO: () => Vector3; // 座標原点の速度
    omega: GeneralVariable;
  }) {
    this.name = params.name;
    this.component = params.component;
    this.mass = params.mass;
    this.vO = params.vO;
    this.omega = params.omega;
    this.pointForceComponents = [...params.pointForceComponents];

    this.cogLocalVec = params.cog.clone();
    this.cogLocalSkew = skew(this.cogLocalVec).mul(2);

    this.pointLocalVec = params.points.map((p) => p.clone());
    this.pointLocalVecMat = params.points.map((p) => getVVector(p)); // 3x1
    this.pointLocalSkew = this.pointLocalVec.map((p) => skew(p).mul(2));
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {
      row,
      component,
      pointForceComponents,
      cogLocalVec,
      cogLocalSkew,
      pointLocalVec,
      pointLocalVecMat,
      pointLocalSkew,
      g
    } = this;

    // 車両座標系そのものの角速度と速度と遠心力
    const omega = new Vector3(0, 0, this.omega.value); // 角速度
    const omegaSkew = skew(omega); // 角速度のSkewMatrix
    const vO = this.vO(); // 車速
    const cO = omega.clone().cross(vO); // 車両座標系にかかる原点の遠心力
    const q = component.quaternion; // 注目している部品の姿勢
    // 部品のの車両座標系での重心
    const cog = cogLocalVec.clone().applyQuaternion(q);
    const cogSkew = skew(cog).mul(-1);
    // 部品にかかる遠心力
    const c = omega.clone().cross(omega.clone().cross(cog)).add(cO);
    const ma = g.clone().add(c).multiplyScalar(this.mass); // 遠心力＋重力
    const maSkew = skew(ma);

    // 力のつり合い
    const translation = pointForceComponents
      .reduce((prev, current) => {
        const f = current.force;
        prev.add(f);
        return prev;
      }, new Vector3())
      .add(ma);

    // モーメントつり合い
    // 変分の方程式がわかりやすくなるようにあえて、力x距離にする
    const rotation = pointForceComponents
      .reduce((prev, current, i) => {
        const f = current.force.clone();
        const s = pointLocalVec[i].clone().applyQuaternion(q);
        f.cross(s);
        prev.add(f);
        return prev;
      }, new Vector3())
      .add(ma.clone().cross(cog));

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
    const sigmaPI = new Matrix(3, 4);
    pointForceComponents.forEach((p, i) => {
      const {col, force} = p;
      // 力の部分のヤコビアン
      phi_q.set(row + X, col + X, 1);
      phi_q.set(row + Y, col + Y, 1);
      phi_q.set(row + Z, col + Z, 1);
      // モーメントの部分のヤコビアン
      const localSkew = pointLocalSkew[i];
      const fSkew = skew(force);
      const AsG = A.mmul(localSkew).mmul(G);
      sigmaPI.add(fSkew.mmul(AsG));

      phi_q.setSubMatrix(
        deltaXcross(A.mmul(pointLocalVecMat[i])),
        row + 3,
        col + X
      );
    });
    sigmaPI.add(maSkew.mmul(A.mmul(cogLocalSkew).mmul(G))); // (3x3) x (3x3) x (3x3) x (3x4) = 3x4

    const colOmega = this.omega.col;
    // 力のつり合い(ω部分)
    const dOmega = getVVector(
      unitZ()
        .multiplyScalar(this.mass)
        .cross(vO.clone().add(cog))
        .add(unitZ().multiplyScalar(omega.dot(cog)))
        .add(cog.multiplyScalar(this.omega.value))
    ); // (3x1)
    phi_q.setSubMatrix(dOmega, row, colOmega);
    const dTheta = omegaSkew.mmul(omegaSkew.mmul(A.mmul(cogLocalSkew).mmul(G))); // (3x4)
    phi_q.setSubMatrix(dTheta, row, col + Q0);
    // モーメントのつり合い
    const dOmegaRot = cogSkew.mmul(dOmega);
    phi_q.setSubMatrix(dOmegaRot, row + 3, colOmega);
    const dThetaRot = cogSkew.mmul(dTheta);
    sigmaPI.add(dThetaRot); // (3x3) x (3x3) x (3x3) x (3x4) = 3x4

    phi_q.setSubMatrix(sigmaPI, row + 3, col + Q0);
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
    vRhs: Vector3;
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
      const c = components[i];
      // 力
      phi_q.set(row + X, pfCol + X, 1);
      phi_q.set(row + Y, pfCol + Y, 1);
      phi_q.set(row + Z, pfCol + Z, 1);
      const deltaP = omegaSkew2.mul(t * this.mass);
      phi_q.setSubMatrix(deltaP, row, c.col + X);

      // モーメント



      if (isFullDegreesComponent(c)) {
        // 力
        const A = rotationMatrix(c.quaternion);
        const G = decompositionMatrixG(c.quaternion);
        phi_q.setSubMatrix(
          deltaP.mmul(A.mmul(localSkew[i]).mmul(G)),
          row,
          c.col + Q0
        );
      }

      phi_q.setSubMatrix(deltaXcross(pts[i]), row + 3, pfCol + X);
      const {col} = lhs;
      const fSkew = skew(pfLhs.force);
      const tempMat = fSkew.add(maSkew.mul(1 - cog));
      phi_q.setSubMatrix(tempMat, row + 3, col + X);

      }
    });
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

  g: Vector3;

  mass: number;

  rO: () => Vector3;

  omegaO: () => Vector3;

  constructor(
    name: string,
    components: Triple<IComponent>,
    mass: number,
    cog: Vector3,
    points: Triple<Vector3>,
    pfs: Triple<PointForce>,
    rO: () => Vector3, // 座標原点の各速度
    omegaO: () => Vector3, // 座標原点の速度
    gravity: Vector3
  ) {
    this.name = name;
    this.cog = points.map((p) => cog.dot(p) / p.lengthSq()) as Triple<number>;
    this.pfs = [...pfs];
    this.components = [...components];
    this.g = gravity.clone();
    this.mass = mass;
    this.rO = rO;
    this.omegaO = omegaO;
    this.localVec = points.map((p) => p.clone()) as Triple<Vector3>;
    this.localSkew = points.map((p) => skew(p)) as Triple<Matrix>;
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row, components, localVec, localSkew, pfs, cog, g} = this;

    const colDone: number[] = [];
    const p = localVec.map((s, i) =>
      s.applyQuaternion(components[i].quaternion).add(components[i].position)
    );
    const pCog = cog.reduce(
      (prev, t, i) => prev.add(p[i].clone().multiplyScalar(t)),
      new Vector3()
    );
    const rO = this.rO();
    const omegaO = this.omegaO();
    const d2r_dt2 = omegaO.clone().cross(omegaO.clone().cross(rO.add(pCog)));
    const ma = g.clone().sub(d2r_dt2).multiplyScalar(this.mass);

    const translation = pfs
      .reduce((prev, p) => prev.add(p.force.clone()), new Vector3())
      .add(ma);
    // 変分の方程式がわかりやすくなるようにあえて、力x距離にする
    // グローバル座標系原点周りのモーメントつり合い
    const rotation = pfs
      .reduce(
        (prev, pf, i) => prev.add(pf.force.clone().cross(p[i])),
        new Vector3()
      )
      .add(ma.clone().cross(pCog));

    phi[row + 0] = translation.x;
    phi[row + 1] = translation.y;
    phi[row + 2] = translation.z;
    phi[row + 3] = rotation.x;
    phi[row + 4] = rotation.y;
    phi[row + 5] = rotation.z;

    components.forEach((component, i) => {
      // Pfのヤコビアン
      const pfCol = pfs[i].col;
      phi_q.set(row + X, pfCol + X, 1);
      phi_q.set(row + Y, pfCol + Y, 1);
      phi_q.set(row + Z, pfCol + Z, 1);
      phi_q.setSubMatrix(deltaXcross(p[i]), row + 3, pfCol + X);
      // componentのヤコビアン
      const {col} = component;
      const f = pfs[i].force;
      const dP = skew(f.clone().add(ma));
      if (!colDone.includes(col)) {
        phi_q.setSubMatrix(dP, row + 3, col + X);
      } else {
        phi_q.subMatrixAdd(dP, row + 3, col + X);
      }
      if (isFullDegreesComponent(component)) {
        const t = cog[i];
        const q = component.quaternion;
        const A = rotationMatrix(q);
        const s = localSkew[i];
        const G = decompositionMatrixG(q);
        const dTheta = skew(f.clone().add(ma.multiplyScalar(t)))
          .mul(A)
          .mul(s)
          .mul(G);
        if (!colDone.includes(col)) {
          phi_q.setSubMatrix(dTheta, row + 3, col + Q0);
        } else {
          phi_q.subMatrixAdd(dTheta, row + 3, col + Q0);
        }
      }
    });
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

  error: GeneralVariable;

  component: IComponent;

  get lhs() {
    return this.components[0];
  }

  get rhs() {
    return this.components[1];
  }

  localVec: Twin<Vector3>;

  localSkew: Twin<Matrix>;

  cog: number;

  g: Vector3;

  mass: number;

  rO: () => Vector3;

  omegaO: () => Vector3;

  ground: () => Vector3;

  normal: () => Vector3;

  getFriction: (sa: number, ia: number, fz: number) => Vector3;

  torqueRatio: number; // 駆動輪の駆動力配分

  constructor(params: {
    name: string;
    component: FullDegreesComponent;
    mass: number;
    cog: number;
    points: Twin<Vector3>; // Component基準
    pfs: Twin<PointForce>; // Bearing部分
    error: LongitudinalForceError;
    torqueRatio: number;
    getFriction: (sa: number, ia: number, fz: number) => Vector3; // タイヤの発生する力
    rO: () => Vector3; // 座標原点の各速度
    omegaO: () => Vector3; // 座標原点の速度
    ground: () => Vector3; // component座標系でのground位置
    normal: () => Vector3;
    gravity: Vector3;
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
      getFriction, // タイヤの発生する力
      rO, // 座標原点の各速度
      omegaO, // 座標原点の速度
      ground, // component座標系でのground位置
      normal,
      gravity
    } = params;

    this.name = name;
    this.cog = cog;
    this.pfs = [...pfs];
    this.error = error;
    this.component = component;
    this.g = gravity.clone();
    this.mass = mass;
    this.torqueRatio = torqueRatio;
    this.rO = rO;
    this.omegaO = omegaO;
    this.getFriction = getFriction;
    this.ground = ground;
    this.normal = normal;
    this.localVec = points.map((p) => p.clone()) as Twin<Vector3>;
    this.localSkew = points.map((p) => skew(p)) as Twin<Matrix>;
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {
      row,
      component,
      localVec,
      localSkew,
      pfs,
      cog,
      g,
      error,
      torqueRatio
    } = this;

    const colDone: number[] = [];
    const p = localVec.map((p) =>
      p.clone().applyQuaternion(component.quaternion).add(component.position)
    );
    const ground = this.ground()
      .clone()
      .applyQuaternion(component.quaternion)
      .add(component.position);
    const pCog = p[1].clone().sub(p[0]).multiplyScalar(cog);
    // 慣性力を算出
    const rO = this.rO();
    const omegaO = this.omegaO();
    const d2r_dt2 = omegaO.clone().cross(omegaO.clone().cross(rO.add(pCog)));
    const ma = g.clone().sub(d2r_dt2).multiplyScalar(this.mass);
    const vO = omegaO.clone().cross(rO);
    // 接地点の速度
    const vGround = vO.clone().add(omegaO.cross(ground));

    // SAとIAとFZを求める
    const normal = this.normal().normalize();
    const axis = p[1].clone().sub(p[0]).normalize();
    // axisに垂直で地面に平行なベクトル(左タイヤが進む方向)
    const parallel = axis.clone().cross(normal).normalize();
    // 速度ベクトルの地面に平行な成分を取得
    const vGParallel = vGround
      .clone()
      .sub(normal.clone().multiplyScalar(normal.dot(vGround)));
    // saの取得
    const saSin = vGParallel.clone().normalize().cross(parallel);
    const saSign = saSin.dot(normal) > 0 ? 1 : -1;
    const sa = (saSin.length() * saSign * 180) / Math.PI;

    // iaの取得
    const tireVirtical = axis.clone().cross(parallel);
    const iaSin = tireVirtical.cross(normal);
    const iaSign = iaSin.dot(parallel) > 0 ? 1 : -1;
    const ia = (iaSin.length() * iaSign * 180) / Math.PI;

    // fzの取得
    // normal方向成分を求める
    const fz = pfs
      .reduce((prev, current) => {
        const f = current.force;
        return prev.add(normal.clone().multiplyScalar(-normal.dot(f)));
      }, new Vector3())
      .add(normal.clone().multiplyScalar(-normal.dot(ma)));

    // タイヤの摩擦力の取得
    const friction = this.getFriction(sa, ia, fz.length()); // この値はタイヤが垂直の時の座標系
    // 垂直方向を合わせたのち、前方方向を合わせる
    friction.applyQuaternion(
      new Quaternion()
        .setFromUnitVectors(new Vector3(1, 0, 0), parallel)
        .multiply(
          new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal)
        )
    );

    // 誤差項
    const fe = normal
      .clone()
      .cross(axis)
      .multiplyScalar(-torqueRatio * error.force);

    // 力のつり合い
    const translation = pfs
      .reduce((prev, p) => prev.add(p.force.clone()), new Vector3())
      .add(ma)
      .add(fz)
      .add(friction)
      .add(fe);

    // 変分の方程式がわかりやすくなるようにあえて、力x距離にする
    // グローバル座標系原点周りのモーメントつり合い
    const rotation = pfs
      .reduce(
        (prev, pf, i) =>
          prev
            .add(pf.force.clone().cross(p[i]))
            .sub(
              normal.clone().cross(ground).multiplyScalar(pf.force.dot(normal))
            ),
        new Vector3()
      )
      .add(ma.clone().cross(pCog))
      .sub(normal.clone().cross(ground).multiplyScalar(ma.dot(normal)))
      .add(friction.clone().add(fe).cross(ground));

    phi[row + 0] = translation.x;
    phi[row + 1] = translation.y;
    phi[row + 2] = translation.z;
    phi[row + 3] = rotation.x;
    phi[row + 4] = rotation.y;
    phi[row + 5] = rotation.z;

    // ヤコビアンの導出
    // 力のつり合い
    const pfCol = pfs[i].col;
    phi_q.set(row + X, pfCol + X, 1);
    phi_q.set(row + Y, pfCol + Y, 1);
    phi_q.set(row + Z, pfCol + Z, 1);
    phi_q.setSubMatrix(skewBase.mmul(getVVector(p[i])), row + 3, pfCol + X);
    // componentのヤコビアン
    const {col} = component;
    const f = pfs[i].force;
    const dP = skew(f.clone().add(ma));
    if (!colDone.includes(col)) {
      phi_q.setSubMatrix(dP, row + 3, col + X);
    } else {
      phi_q.setSubMatrix(
        phi_q.subMatrix(row + 3, row + 5, col + X, col + Z).add(dP),
        row + 3,
        col + X
      );
    }
    const t = cog[i];
    const q = component.quaternion;
    const A = rotationMatrix(q);
    const s = localSkew[i];
    const G = decompositionMatrixG(q);
    const dTheta = skew(f.clone().add(ma.multiplyScalar(t)))
      .mul(A)
      .mul(s)
      .mul(G);
    if (!colDone.includes(col)) {
      phi_q.setSubMatrix(dTheta, row + 3, col + Q0);
    } else {
      phi_q.setSubMatrix(
        phi_q.subMatrix(row + 3, row + 5, col + Q0, col + Q3).add(dTheta),
        row + 3,
        col + Q0
      );
    }
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}
