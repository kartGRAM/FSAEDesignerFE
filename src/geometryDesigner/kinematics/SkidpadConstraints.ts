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
  getDeltaOmega,
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
    // 部品の部品座標系での重心
    const cog = cogLocalVec.clone().applyQuaternion(q);
    const pCog = cog.clone().add(component.position);
    const cogSkew = skew(cog).mul(2);
    // 部品にかかる遠心力
    const c = omega.clone().cross(omega.clone().cross(pCog)).add(cO);
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
    let dThetaM = new Matrix(3, 3);
    pointForceComponents.forEach((pf, i) => {
      // 力の部分のヤコビアン
      phi_q.set(row + X, pf.col + X, 1);
      phi_q.set(row + Y, pf.col + Y, 1);
      phi_q.set(row + Z, pf.col + Z, 1);
      // モーメントの部分のヤコビアン
      phi_q.setSubMatrix(
        A.mmul(pointLocalVecMat[i]).mul(-1),
        row + 3,
        pf.col + X
      );
      // theta部分の微分
      const localSkew = pointLocalSkew[i];
      const fSkew = skew(pf.force);
      const As = A.mmul(localSkew);
      dThetaM = dThetaM.add(fSkew.mmul(As));
    });
    dThetaM = dThetaM.add(maSkew.mmul(A).mmul(cogLocalSkew)); // (3x3) x (3x3) x (3x3) x (3x4) = 3x4

    const colOmega = this.omega.col;
    // 力のつり合い(ω部分)
    const dOmega = getDeltaOmega(
      vO,
      omega,
      omegaSkew,
      pCog,
      cogSkew,
      this.mass
    ).mmul(unitZ); // (3x1)
    phi_q.setSubMatrix(dOmega, row, colOmega);
    const dTheta2 = omegaSkew
      .mmul(omegaSkew.mmul(A).mmul(cogLocalSkew))
      .mul(this.mass); // (3x4)
    phi_q.setSubMatrix(dTheta2.mmul(G), row, col + Q0);
    // モーメントのつり合い
    const dOmegaRot = cogSkew.mmul(dOmega).mul(-1);
    phi_q.setSubMatrix(dOmegaRot, row + 3, colOmega);
    const dThetaRot = cogSkew.mmul(dTheta2).mul(-1);
    dThetaM.add(dThetaRot); // (3x3) x (3x3) x (3x3) x (3x4) = 3x4

    phi_q.setSubMatrix(dThetaM.mmul(G), row + 3, col + Q0);
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
    const cogSkew = skew(pCog).mul(2);

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
      cogSkew,
      this.mass
    ).mmul(unitZ); // (3x1)
    phi_q.setSubMatrix(dOmega, row, colOmega);
    // モーメントのつり合い(ω部分)
    const dOmegaRot = cogSkew.mmul(dOmega).mul(-1);
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
    const cogSkew = skew(pCog).mul(2);

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
      cogSkew,
      this.mass
    ).mmul(unitZ); // (3x1)
    phi_q.setSubMatrix(dOmega, row, colOmega);
    // モーメントのつり合い(ω部分)
    const dOmegaRot = cogSkew.mmul(dOmega).mul(-1);
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

  constructor(params: {
    name: string;
    component: FullDegreesComponent;
    points: Twin<Vector3>; // Component基準
    mass: number;
    cog: number;
    pfs: Twin<PointForce>; // Bearing部分
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
    this.error = error;
    this.component = component;
    this.mass = mass;
    this.torqueRatio = torqueRatio;
    this.omega = omega;
    this.getFriction = getFriction;
    this.vO = vO;
    this.ground = ground;
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

    const p = localVec.map((p) => p.applyQuaternion(component.quaternion));
    const pSkew = p.map((p) => skew(p));
    // 接地点
    const ground = this.ground();
    const groundQ = this.ground().clone().applyQuaternion(component.quaternion);
    const localGroundSkew = skew(ground);
    const groundSkewQ = skew(groundQ).mul(2);

    // 重心
    const localCog = localVec[1]
      .clone()
      .sub(localVec[0])
      .multiplyScalar(cog)
      .add(localVec[0]);
    const pCogQ = localCog.clone().applyQuaternion(component.quaternion);
    const pCog = pCogQ.clone().add(component.position); // 車両座標系
    const cogSkewP = skew(pCog).mul(2);
    const cogSkewQ = skew(pCogQ).mul(2);
    const cogLocalSkew = skew(pCogQ).mul(2);
    // 慣性力
    const omega = new Vector3(0, 0, this.omega.value);
    const omegaSkew = skew(omega); // 角速度のSkewMatrix
    const omegaSkew2 = omegaSkew.mmul(omegaSkew);
    const vO = this.vO(); // 車速
    const cO = omega.clone().cross(vO); // 車両座標系にかかる原点の遠心力

    const c = omega.clone().cross(omega.clone().cross(pCog)).add(cO);
    const ma = g.clone().add(c).multiplyScalar(this.mass); // 遠心力＋重力
    const maSkew = skew(ma);
    // 接地点の速度
    const vGround = vO
      .clone()
      .add(omega.cross(groundQ.clone().add(component.position)));

    // SAとIAとFZを求める
    const normal = new Vector3(0, 0, 1);
    const axis = p[1].clone().sub(p[0]).normalize();
    const localAxisSkew = skew(localVec[1].clone().sub(localVec[0])).mul(2);
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
    const tireVirtical = axis.clone().cross(parallel).normalize();
    const iaSin = tireVirtical.cross(normal);
    const iaSign = iaSin.dot(parallel) > 0 ? 1 : -1;
    const ia = (iaSin.length() * iaSign * 180) / Math.PI;

    // fzの取得
    // normal方向成分を求める
    const fz = pfs
      .reduce((prev, current) => {
        return prev.add(new Vector3(0, 0, -current.force.z));
      }, new Vector3())
      .add(new Vector3(0, 0, -ma.z));

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
    const frictionSkew = skew(friction);

    // 誤差項
    const fe = normal
      .clone()
      .cross(axis)
      .multiplyScalar(-torqueRatio * error.value);
    const feSkew = skew(fe);

    // 力のつり合い
    const translation = pfs
      .reduce((prev, p) => prev.add(p.force), new Vector3())
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
              .cross(p[i])
              .add(new Vector3(0, 0, -pf.force.z).cross(groundQ))
          ),
        new Vector3()
      )
      .add(ma.clone().cross(pCogQ).add(new Vector3(0, 0, -ma.z).cross(groundQ)))
      .add(friction.clone().add(fe).cross(groundQ));

    phi[row + X] = translation.x;
    phi[row + Y] = translation.y;
    // phi[row + Z] = translation.z; // Zは0なので省略
    phi[row + 2 + X] = rotation.x;
    phi[row + 2 + Y] = rotation.y;
    phi[row + 2 + Z] = rotation.z;

    // 力のつり合い
    const A = rotationMatrix(component.quaternion);
    const G = decompositionMatrixG(component.quaternion);

    const dOmega = getDeltaOmega(
      vO,
      omega,
      omegaSkew,
      pCog,
      cogSkewP,
      this.mass
    ).mmul(unitZ);
    const dP = omegaSkew2.mul(this.mass);
    const dTheta1 = omegaSkew2.mmul(A).mmul(cogLocalSkew);
    const dTheta2 = unitZSkew
      .mmul(A)
      .mmul(localAxisSkew)
      .mul(-torqueRatio * error.value);
    const dTheta = dTheta1.add(dTheta2).mmul(G);
    const de = unitZSkew.mmul(getVVector(axis)).mul(-torqueRatio);
    phi_q.set(row + X, pfs[0].col + X, 1);
    phi_q.set(row + Y, pfs[0].col + Y, 1);
    phi_q.set(row + X, pfs[1].col + X, 1);
    phi_q.set(row + Y, pfs[1].col + Y, 1);
    phi_q.setSubMatrix(dOmega.subMatrix(0, 1, 0, 0), row, this.omega.col);
    phi_q.setSubMatrix(dP.subMatrix(0, 1, 0, 2), row, component.col + X);
    phi_q.setSubMatrix(dTheta.subMatrix(0, 1, 0, 3), row, component.col + Q0);
    phi_q.setSubMatrix(de.subMatrix(0, 1, 0, 0), row, error.col);

    // モーメントのつり合い
    // pf
    pfs.forEach((pf, i) => {
      const dPf = pSkew[i].mul(-1).subMatrixAdd(skew(pCogQ).mmul(unitZ), 0, 2);
      phi_q.setSubMatrix(dPf, row + 3, pf.col);
    });

    // dΘ
    let dThetaM = new Matrix(3, 3);
    pfs.forEach((pf, i) => {
      const fSkew = skew(pf.force);
      dThetaM = dThetaM.add(fSkew.mmul(A).mmul(localSkew[i]));
      dThetaM = dThetaM.sub(
        unitZSkew.mmul(A).mmul(localAxisSkew).mul(pf.force.z)
      );
    });
    dThetaM = dThetaM.add(maSkew.mmul(A).mmul(cogLocalSkew));
    dThetaM = dThetaM.add(
      frictionSkew.add(feSkew).mmul(A).mmul(localGroundSkew)
    );
    dThetaM = dThetaM.add(
      skew(groundQ)
        .mmul(unitZSkew)
        .mmul(A)
        .mmul(localAxisSkew)
        .mul(torqueRatio * error.value)
    );
    const temp = groundSkewQ
      .mmul(unitZ)
      .mmul(unitZ.transpose())
      .sub(cogSkewQ)
      .mul(this.mass);
    const temp2 = temp.mul(omegaSkew2);
    dThetaM = dThetaM.add(temp2.mmul(A).mmul(cogLocalSkew));
    phi_q.setSubMatrix(dThetaM.mmul(G), row + 3, component.col + Q0);
    // dP
    phi_q.setSubMatrix(temp2, row + 3, component.col + X);
    // dω
    phi_q.setSubMatrix(temp.mmul(dOmega), row + 3, this.omega.col);
    // de
    const de2 = groundSkewQ.mmul(unitZSkew).mmul(getVVector(axis));
    phi_q.setSubMatrix(de2, row + 3, this.error.col);
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}
