import {Matrix} from 'ml-matrix';
import {IScalar} from './IScalar';
import {Scalar} from './Scalar';
import {isConstant} from './IConstant';

export type Vector3Like = {x: number; y: number; z: number};
export type QuaternionLike = {w: number; x: number; y: number; z: number};

export function skew(v: {x: number; y: number; z: number} | Matrix) {
  if ('x' in v) {
    return new Matrix([
      [0, -v.z, v.y],
      [v.z, 0, -v.x],
      [-v.y, v.x, 0]
    ]);
  }
  if (v.rows !== 3 || v.columns !== 1) throw new Error('Vector3でない');
  const x = v.get(0, 0);
  const y = v.get(1, 0);
  const z = v.get(2, 0);
  return new Matrix([
    [0, -z, y],
    [z, 0, -x],
    [-y, x, 0]
  ]);
}

export function getVVector(value: Vector3Like) {
  const {x, y, z} = value;
  return new Matrix([[x], [y], [z]]);
}

export function getVQuaternion(value: QuaternionLike) {
  const {w, x, y, z} = value;
  return new Matrix([[w], [x], [y], [z]]);
}

// 回転行列を取得
export function rotationMatrix(q: QuaternionLike) {
  const e0 = q.w;
  const e1 = q.x;
  const e2 = q.y;
  const e3 = q.z;
  return new Matrix([
    [
      2 * (e1 * e1 + e0 * e0 - 1 / 2),
      2 * (e1 * e2 - e0 * e3),
      2 * (e1 * e3 + e0 * e2)
    ],
    [
      2 * (e0 * e3 + e1 * e2),
      2 * (e2 * e2 + e0 * e0 - 1 / 2),
      2 * (e2 * e3 - e0 * e1)
    ],
    [
      2 * (e1 * e3 - e0 * e2),
      2 * (e2 * e3 + e0 * e1),
      2 * (e3 * e3 + e0 * e0 - 1 / 2)
    ]
  ]);
}

// 回転行列の部分分解行列を取得
export function decompositionMatrixG(q: QuaternionLike) {
  const e0 = q.w;
  const e1 = q.x;
  const e2 = q.y;
  const e3 = q.z;
  return new Matrix([
    [-e1, e0, e3, -e2],
    [-e2, -e3, e0, e1],
    [-e3, e2, -e1, e0]
  ]);
}

// 逆変換の部分分解行列を取得
export function decompositionMatrixE(q: QuaternionLike) {
  const e0 = q.w;
  const e1 = q.x;
  const e2 = q.y;
  const e3 = q.z;
  return new Matrix([
    [-e1, e0, -e3, e2],
    [-e2, e3, e0, -e1],
    [-e3, -e2, e1, e0]
  ]);
}

// k=U/|U| として、δk=XδU のXを返す。
const I = Matrix.eye(3, 3);
export function normalizedVectorDiff(u: Vector3Like): Matrix {
  const abs = Math.sqrt(u.x * u.x + u.y * u.y + u.z * u.z);
  const u3 = abs ** 3;
  const u2 = abs ** 2;
  const U = getVVector(u);
  const UUt = U.mmul(U.clone().transpose());
  const u2I = I.clone().mul(u2);
  const temp = u2I.sub(UUt);
  const d = temp.mul(1 / u3);
  return d;
}

// k=|u| として、δk=Xδu のXを返す。
export function normVectorDiff(u: Vector3Like): Matrix {
  const abs = Math.sqrt(u.x * u.x + u.y * u.y + u.z * u.z);
  const uT = getVVector(u).transpose();
  return uT.mul(1 / abs);
}

export function asin(value: IScalar) {
  return new Scalar(
    () => {
      const lhs = value.scalarValue; // (1x1)
      const coef = 1 / Math.sqrt(1 - lhs ** 2);
      return {
        value: () => Matrix.eye(1, 1).mul(Math.asin(lhs)),
        diff: (mat: Matrix) => {
          if (!isConstant(value)) value.diff(mat.clone().mul(coef));
        }
      };
    },
    (options) => {
      value.reset(options);
    }
  );
}
