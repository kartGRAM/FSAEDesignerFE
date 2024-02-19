/* eslint-disable @typescript-eslint/no-unused-vars */
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
    const invQ = this.rotation.clone().invert();

    this.center = new Vector3(center[0], center[1], center[2]).applyQuaternion(
      this.rotation
    );

    return this;
  }

  // eslint-disable-next-line class-methods-use-this
  getNearestNeighborToLine() {
    return new Vector3();
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
