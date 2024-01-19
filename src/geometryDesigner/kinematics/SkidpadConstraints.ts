/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import {Matrix} from 'ml-matrix';
import {Vector3} from 'three';
import {Triple} from '@utils/atLeast';
import {
  skew,
  rotationMatrix,
  decompositionMatrixG,
  skewBase,
  getVVector
} from './KinematicFunctions';
import {
  IComponent,
  FullDegreesComponent,
  isFullDegreesComponent,
  PointForce
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

  g: Vector3;

  mass: number;

  rO: () => Vector3;

  omegaO: () => Vector3;

  constructor(
    name: string,
    component: FullDegreesComponent,
    mass: number,
    cog: Vector3,
    points: Vector3[],
    pointForceComponents: PointForce[],
    rO: () => Vector3, // 座標原点の各速度
    omegaO: () => Vector3, // 座標原点の速度
    gravity: Vector3
  ) {
    this.name = name;
    this.component = component;
    this.g = gravity.clone();
    this.mass = mass;
    this.rO = rO;
    this.omegaO = omegaO;
    this.pointForceComponents = [...pointForceComponents];

    this.cogLocalVec = cog.clone();
    this.cogLocalSkew = skew(this.cogLocalVec).mul(2);

    this.pointLocalVec = points.map((p) => p.clone());
    this.pointLocalVecMat = points.map((p) => getVVector(p)); // 3x1
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

    const rO = this.rO();
    const omegaO = this.omegaO();
    const q = component.quaternion;
    const cog = cogLocalVec.clone().applyQuaternion(q);
    const d2r_dt2 = omegaO.clone().cross(omegaO.clone().cross(rO.add(cog)));
    const ma = g.clone().sub(d2r_dt2).multiplyScalar(this.mass);
    const maSkew = skew(ma);
    const translation = pointForceComponents
      .reduce((prev, current) => {
        const f = current.force;
        prev.add(f);
        return prev;
      }, new Vector3())
      .add(ma);
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

    phi[row + 0] = translation.x;
    phi[row + 1] = translation.y;
    phi[row + 2] = translation.z;
    phi[row + 3] = rotation.x;
    phi[row + 4] = rotation.y;
    phi[row + 5] = rotation.z;

    const {col} = component;

    const A = rotationMatrix(q);
    const G = decompositionMatrixG(q);
    const sigmaPI = new Matrix(3, 4);
    pointForceComponents.forEach((p, i) => {
      const {col, force} = p;
      phi_q.set(row + X, col + X, 1);
      phi_q.set(row + Y, col + Y, 1);
      phi_q.set(row + Z, col + Z, 1);
      const localSkew = pointLocalSkew[i];
      const fSkew = skew(force);
      const AsG = A.mmul(localSkew).mmul(G);
      sigmaPI.add(fSkew.mmul(AsG));

      phi_q.setSubMatrix(
        skewBase.mmul(A.mmul(pointLocalVecMat[i])),
        row + 3,
        col + X
      );
    });
    sigmaPI.add(maSkew.mmul(A.mmul(cogLocalSkew).mmul(G))); // (3x3) x (3x3) x (3x3) x (3x4) = 3x4
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

  pfLhs: PointForce;

  pfRhs: PointForce;

  lhs: IComponent;

  rhs: IComponent;

  lLocalVec: Vector3;

  lLocalSkew: Matrix;

  rLocalVec: Vector3;

  rLocalSkew: Matrix;

  cog: number;

  g: Vector3;

  mass: number;

  rO: () => Vector3;

  omegaO: () => Vector3;

  constructor(
    name: string,
    cLhs: IComponent,
    cRhs: IComponent,
    mass: number,
    cog: number, // lhs基準
    vLhs: Vector3,
    vRhs: Vector3,
    pfLhs: PointForce,
    pfRhs: PointForce,
    rO: () => Vector3, // 座標原点の各速度
    omegaO: () => Vector3, // 座標原点の速度
    gravity: Vector3
  ) {
    this.name = name;
    this.lhs = cLhs;
    this.rhs = cRhs;
    this.cog = cog;
    this.pfLhs = pfLhs;
    this.pfRhs = pfRhs;
    this.g = gravity.clone();
    this.mass = mass;
    this.rO = rO;
    this.omegaO = omegaO;
    this.lLocalVec = vLhs.clone();
    this.lLocalSkew = skew(this.lLocalVec).mul(2);
    this.rLocalVec = vRhs.clone();
    this.rLocalSkew = skew(this.rLocalVec).mul(-2);
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {
      row,
      lhs,
      rhs,
      lLocalVec,
      lLocalSkew,
      rLocalVec,
      rLocalSkew,
      pfLhs,
      pfRhs,
      g,
      cog
    } = this;

    const qLhs = lhs.quaternion;
    const qRhs = rhs.quaternion;
    const pLhs = lLocalVec.clone().applyQuaternion(qLhs).add(lhs.position);
    const pRhs = rLocalVec.clone().applyQuaternion(qRhs).add(rhs.position);
    const pCog = pRhs.clone().sub(pLhs).multiplyScalar(cog);

    const rO = this.rO();
    const omegaO = this.omegaO();
    const d2r_dt2 = omegaO.clone().cross(omegaO.clone().cross(rO.add(pCog)));
    const ma = g.clone().sub(d2r_dt2).multiplyScalar(this.mass);
    const maSkew = skew(ma);

    const translation = pfLhs.force.clone().add(pfRhs.force).add(ma);
    // 変分の方程式がわかりやすくなるようにあえて、力x距離にする
    // グローバル座標系原点周りのモーメントつり合い
    const nl = pfLhs.force.clone().cross(pLhs);
    const nr = pfRhs.force.clone().cross(pRhs);
    const rotation = nl.add(nr).add(ma.clone().cross(pCog));

    phi[row + 0] = translation.x;
    phi[row + 1] = translation.y;
    phi[row + 2] = translation.z;
    phi[row + 3] = rotation.x;
    phi[row + 4] = rotation.y;
    phi[row + 5] = rotation.z;

    {
      const pfCol = pfLhs.col;
      phi_q.set(row + X, pfCol + X, 1);
      phi_q.set(row + Y, pfCol + Y, 1);
      phi_q.set(row + Z, pfCol + Z, 1);
      phi_q.setSubMatrix(skewBase.mmul(getVVector(pLhs)), row + 3, pfCol + X);
      const {col} = lhs;
      const fSkew = skew(pfLhs.force);
      const tempMat = fSkew.add(maSkew.mul(1 - cog));
      phi_q.setSubMatrix(tempMat, row + 3, col + X);

      if (isFullDegreesComponent(lhs)) {
        const A = rotationMatrix(qLhs);
        const G = decompositionMatrixG(qLhs);
        phi_q.setSubMatrix(
          tempMat.mmul(A.mmul(lLocalSkew).mmul(G)),
          row + 3,
          col + Q0
        );
      }
    }

    {
      const pfCol = pfRhs.col;
      phi_q.set(row + X, pfCol + X, 1);
      phi_q.set(row + Y, pfCol + Y, 1);
      phi_q.set(row + Z, pfCol + Z, 1);
      phi_q.setSubMatrix(skewBase.mmul(getVVector(pRhs)), row + 3, pfCol + X);
      const {col} = rhs;
      const fSkew = skew(pfRhs.force);
      const tempMat = fSkew.add(maSkew.mul(cog));
      phi_q.setSubMatrix(tempMat, row + 3, col + X);

      if (isFullDegreesComponent(rhs)) {
        const A = rotationMatrix(qRhs);
        const G = decompositionMatrixG(qRhs);
        phi_q.setSubMatrix(
          tempMat.mmul(A.mmul(rLocalSkew).mmul(G)),
          row + 3,
          col + Q0
        );
      }
    }
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
    const p = components.map((c) => c.position.applyQuaternion(c.quaternion));
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
        (prev, p, i) => prev.add(p.force.clone().cross(localVec[i])),
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
          phi_q.setSubMatrix(
            phi_q.subMatrix(row + 3, row + 5, col + Q0, col + Q3).add(dTheta),
            row + 3,
            col + Q0
          );
        }
      }
    });
  }

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}