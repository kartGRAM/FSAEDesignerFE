import {Vector3, Quaternion, Matrix3, Matrix4} from 'three';
import {IOBB, IDataOBB} from '@gd/IOBB';
import {Matrix, EigenvalueDecomposition} from 'ml-matrix';
import {getVector3} from '@gd/kinematics/KinematicFunctions';
import {range} from '@utils/helpers';

export class OBB implements IOBB {
  isOBB = true as const;

  center: Vector3;

  halfSize: Vector3;

  rotation: Quaternion;

  constructor() {
    this.center = new Vector3();
    this.halfSize = new Vector3(1, 1, 1);
    this.rotation = new Quaternion();
  }

  setFromVertices(vertices: Vector3[]) {
    if (vertices.length < 2) throw new Error('2点以上必要');
    // 頂点の平均を導出
    const avg = vertices
      .reduce((v, current) => v.add(current), new Vector3())
      .multiplyScalar(1 / vertices.length);

    // 頂点の共分散行列を取得
    const S = vertices
      .reduce((s, v) => {
        const si = v.clone().sub(avg);
        s.add(
          new Matrix([
            [si.x * si.x, si.x * si.y, si.x * si.z],
            [si.y * si.x, si.y * si.y, si.y * si.z],
            [si.z * si.x, si.z * si.y, si.z * si.z]
          ])
        );
        return s;
      }, new Matrix(3, 3))
      .mul(1 / vertices.length);
    // 固有値分解
    const evd = new EigenvalueDecomposition(S);
    // 固有ベクトル
    const eigenVecs = range(0, 3).map((i) =>
      getVector3(evd.eigenvectorMatrix.getColumnVector(i))
    );

    // 固有ベクトルをもとに回転行列を作成
    eigenVecs[2] = eigenVecs[0].clone().cross(eigenVecs[1]);
    const rotationMatrix = new Matrix3().set(
      // eslint-disable-next-line prettier/prettier
      eigenVecs[0].x, eigenVecs[1].x, eigenVecs[2].x,
      // eslint-disable-next-line prettier/prettier
      eigenVecs[0].y, eigenVecs[1].y, eigenVecs[2].y,
      // eslint-disable-next-line prettier/prettier
      eigenVecs[0].z, eigenVecs[1].z, eigenVecs[2].z
    );
    this.rotation = new Quaternion().setFromRotationMatrix(
      new Matrix4().setFromMatrix3(rotationMatrix)
    );

    // 固有ベクトル方向へ射影
    const minMax = eigenVecs.map((v) => {
      const minMax = vertices.reduce(
        (minMax, current) => {
          const l = v.dot(current);
          if (l < minMax[0]) minMax[0] = l;
          if (minMax[1] < l) minMax[1] = l;
          return minMax;
        },
        [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER] as [number, number]
      );
      return minMax;
    });
    // 各辺の長さ
    const halfVec = minMax.map((minMax) => (minMax[1] - minMax[0]) / 2);
    this.halfSize = new Vector3(halfVec[0], halfVec[1], halfVec[2]);

    // 中心座標
    const center = minMax.map((minMax) => (minMax[1] + minMax[0]) / 2);

    this.center = new Vector3(center[0], center[1], center[2]).applyQuaternion(
      this.rotation
    );

    return this;
  }

  getNearestNeighborToLine(
    p: Vector3,
    v: Vector3,
    parentP?: Vector3,
    parentQ?: Quaternion
  ): {closest: Vector3; distance: number} {
    p = p.clone();
    v = v.clone().normalize();
    if (parentP) p.sub(parentP);
    if (parentQ) {
      const invParentQ = parentQ.clone().invert();
      p.applyQuaternion(invParentQ);
      v.applyQuaternion(invParentQ);
    }
    p.sub(this.center);
    const invQ = this.rotation.clone().invert();
    p.applyQuaternion(invQ);
    v.applyQuaternion(invQ);
    // AABBと直線の最近傍点
    const sgn = [-1, 1];
    const XYZ = [0, 1, 2];
    let closest = Number.MAX_SAFE_INTEGER;
    const closestPoint = new Vector3();
    // 12辺の総当たりにて最近傍点探索
    XYZ.forEach((i) => {
      const l = this.halfSize.getComponent(i);
      const others = XYZ.filter((j) => j !== i);
      sgn.forEach((sgn1) => {
        const l1 = this.halfSize.getComponent(others[0]) * sgn1;
        sgn.forEach((sgn2) => {
          const l2 = this.halfSize.getComponent(others[1]) * sgn2;
          const offset = new Vector3()
            .setComponent(others[0], l1)
            .setComponent(others[1], l2);
          const p1 = p.clone().sub(offset);
          const D1 = -p1.dot(v);
          const D2 = -p1.getComponent(i);
          const Dv = v.getComponent(i);
          const Dv2 = Dv * Dv;
          const t2 =
            Dv2 === 1
              ? 0
              : Math.max(-l, Math.min((D2 - D1 * Dv) / (Dv2 - 1), l));
          const tempClosestPoint = new Vector3().setComponent(i, t2);
          p1.sub(tempClosestPoint);
          const distance = p1.sub(v.clone().multiplyScalar(p1.dot(v))).length();
          if (distance < closest) {
            closest = distance;
            closestPoint.copy(tempClosestPoint.add(offset));
          }
        });
      });
    });
    // closestPointに最近傍点が入っているので、返す。
    closestPoint.applyQuaternion(this.rotation);
    closestPoint.add(this.center);
    if (parentQ) {
      closestPoint.applyQuaternion(parentQ);
    }
    if (parentP) closestPoint.add(parentP);
    return {
      closest: closestPoint,
      distance: closest
    };
  }

  getData(): IDataOBB {
    return {
      isDataOBB: true,
      center: [this.center.x, this.center.y, this.center.z],
      halfSize: [this.halfSize.x, this.halfSize.y, this.halfSize.z],
      rotation: [
        this.rotation.w,
        this.rotation.x,
        this.rotation.y,
        this.rotation.z
      ]
    };
  }
}
