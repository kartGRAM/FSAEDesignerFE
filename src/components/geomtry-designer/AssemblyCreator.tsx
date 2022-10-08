/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {Quaternion, Vector3} from 'three';
import {useSelector, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {
  setAssembly,
  setCollectedAssembly
} from '@store/reducers/uiTempGeometryDesigner';
import {
  IAssembly,
  isElement,
  isBodyOfFrame,
  JointAsVector3
} from '@gd/IElements';
import * as math from 'mathjs';

import {getAssembly} from '@gd/Elements';

const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;
const Q1 = 4;
const Q2 = 5;
const Q3 = 6;

export default function AssemblyCreactor() {
  const dispatch = useDispatch();
  const assembly = useSelector(
    (state: RootState) => state.dgd.present.topAssembly
  );
  const assembled = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.assembled
  );

  // アセンブリデータに変更があった場合に実行
  React.useEffect(() => {
    const start = performance.now();
    if (assembly) {
      const iAssembly = getAssembly(assembly);
      dispatch(setAssembly(iAssembly));
      dispatch(setCollectedAssembly(iAssembly.collectElements()));
    } else {
      dispatch(setAssembly(undefined));
      dispatch(setCollectedAssembly(undefined));
    }
    // 実行時間を計測した処理
    const end = performance.now();
    // eslint-disable-next-line no-console
    console.log(end - start);
  }, [assembly]);

  React.useEffect(() => {
    if (assembled) {
      const assembly = store.getState().uitgd.collectedAssembly;
      if (assembly) {
        try {
          getKinematicConstrainedElements(assembly);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log(e);
        }
      }
      return;
    }
    const start = performance.now();
    const assembly = store.getState().dgd.present.topAssembly;
    if (assembly) {
      const iAssembly = getAssembly(assembly);
      dispatch(setAssembly(iAssembly));
      dispatch(setCollectedAssembly(iAssembly.collectElements()));
    }
    // 実行時間を計測した処理
    const end = performance.now();
    // eslint-disable-next-line no-console
    console.log(end - start);
  }, [assembled]);

  return null;
}

// 拘束式を反映して拘束する
export function getKinematicConstrainedElements(assembly: IAssembly): void {
  const start = performance.now();
  const {children} = assembly;
  const numGeneralizedCoordinates = children.length * 7; // OKオイラーパラメータ4+XYZ
  let qN = math.zeros([numGeneralizedCoordinates, 1], 'dense') as math.Matrix;
  let qN1 = math.ones([numGeneralizedCoordinates, 1], 'dense') as math.Matrix;
  const joints = assembly.getJointsAsVector3();

  const maxCnt = 2;
  let i = 0;
  let minNorm: number | math.BigNumber = Number.MAX_SAFE_INTEGER;
  let eq = false;
  while (!eq && ++i < maxCnt) {
    const phi_q = getKinematicJacobianMatrix(assembly, joints);
    const phi = getKinematicConstrainsVector(assembly, joints);
    // const A = math.pinv(phi_q);
    const [q, U, V] = svd(phi_q);
    const V2 = math.transpose(V);
    const I = math.multiply(V, V2);
    const I2 = math.multiply(U, math.transpose(U));
    multDiag(q, V2);

    const phi_q2 = math.multiply(U, V2);

    const qinv = q.map((q) => 1 / q);
    const Ut = math.transpose(U);
    multDiag(qinv, Ut);
    const dq = math.multiply(math.transpose(V), math.multiply(Ut, phi));

    // const dq = math.multiply(A, phi);

    qN = getGeneralizedCoordinates(assembly);
    qN1 = math.subtract(qN, dq);
    setGeneralizedCoordinates(assembly, qN1);
    let norm: number | math.BigNumber;
    [eq, norm] = equal(qN, qN1);
    if (norm > math.multiply(minNorm, 10)) {
      // eslint-disable-next-line no-console
      console.log('収束していない');
      throw new Error('ニュートンラプソン法収束エラー');
    }
    if (norm < minNorm) {
      minNorm = norm;
    }
  }

  const end = performance.now();

  // eslint-disable-next-line no-console
  console.log(end - start);
}

// 拘束式のヤコビアンを求める。
export function getKinematicJacobianMatrix(
  assembly: IAssembly,
  joints: JointAsVector3[]
): math.Matrix {
  const {children} = assembly;
  const numConstrainsByJoint = joints.length * 3;
  const eulerParameterConstrains = children.length;
  let numConstrains = numConstrainsByJoint + eulerParameterConstrains;

  const {assemblyMode} = store.getState().uigd.present.gdSceneState;
  if (assemblyMode === 'FixedFrame') {
    numConstrains += 6;
  }
  const numGeneralizedCoordinates = children.length * 7; // OKオイラーパラメータ4+XYZ

  const matrix = math.zeros(
    [numConstrains, numGeneralizedCoordinates],
    'dense'
  ) as math.Matrix;

  const indices = children.reduce(
    (prev: {[index: string]: number}, current, idx) => {
      prev[current.nodeID] = idx * 7;
      return prev;
    },
    {}
  );

  // 球ジョイント拘束のヤコビアン
  joints.forEach((joint, r) => {
    // Φ = pl + Avl - pr - Avr
    // Φ_qを求める。
    const {lhs, rhs} = joint;
    const row = r * 3 + 0;
    if (!isElement(lhs.parent) || !isElement(rhs.parent)) {
      throw new Error('ジョイントの構成要素の親がElementでない');
    }
    const vLhs = lhs.value;
    const eLhs = lhs.parent;
    const qLhs = eLhs.rotation.value;
    const colLhs = indices[eLhs.nodeID];
    const vRhs = rhs.value;
    const eRhs = rhs.parent;
    const qRhs = eRhs.rotation.value;
    const colRhs = indices[eRhs.nodeID];
    // diff of positions are 1
    matrix.set([row + X, colLhs + X], 1);
    matrix.set([row + Y, colLhs + Y], 1);
    matrix.set([row + Z, colLhs + Z], 1);
    matrix.set([row + X, colRhs + X], -1);
    matrix.set([row + Y, colRhs + Y], -1);
    matrix.set([row + Z, colRhs + Z], -1);
    // get Quaternion Parameters
    const qDiffLhs = getPartialDiffOfRotationMatrix(qLhs, vLhs);
    const qDiffRhs = math.multiply(
      getPartialDiffOfRotationMatrix(qRhs, vRhs),
      -1
    );
    matrix.subset(
      math.index(
        math.range(row + X, row + Z + 1),
        math.range(colLhs + Q0, colLhs + Q3 + 1)
      ),
      qDiffLhs
    );
    matrix.subset(
      math.index(
        math.range(row + X, row + Z + 1),
        math.range(colRhs + Q0, colRhs + Q3 + 1)
      ),
      qDiffRhs
    );
  });

  // フレームボディについては完全拘束する
  if (assemblyMode === 'FixedFrame') {
    // x=y=z=q1=q2=q3=0, q0=1←q0=1は正規化条件で出てくるので入れない。
    const frame = children.find((child) => isBodyOfFrame(child));
    if (!frame) throw new Error('フレームボディが見つからない');
    const col = indices[frame.nodeID];
    const row = numConstrainsByJoint;

    matrix.set([row + X, col + X], 1);
    matrix.set([row + Y, col + Y], 1);
    matrix.set([row + Z, col + Z], 1);
    matrix.set([row + Q1 - 1, col + Q1], 1);
    matrix.set([row + Q2 - 1, col + Q2], 1);
    matrix.set([row + Q3 - 1, col + Q3], 1);
  }

  // クォータニオンの正規化条件
  children.forEach((child, r) => {
    // Φ = q0^2 + q1^2 + q2^2 + q3^2
    // Φ_qを求める。
    const q = child.rotation.value;

    const e0 = q.w;
    const e1 = q.x;
    const e2 = q.y;
    const e3 = q.z;
    const col = indices[child.nodeID];
    const row = numConstrains - eulerParameterConstrains + r;
    // diff of positions are 1
    matrix.set([row, col + Q0], 2 * e0);
    matrix.set([row, col + Q1], 2 * e1);
    matrix.set([row, col + Q2], 2 * e2);
    matrix.set([row, col + Q3], 2 * e3);
  });

  return matrix;
}

// 拘束式の現在の値を求める。
export function getKinematicConstrainsVector(
  assembly: IAssembly,
  joints: JointAsVector3[]
): math.Matrix {
  const {children} = assembly;
  const numConstrainsByJoint = joints.length * 3;
  const eulerParameterConstrains = children.length;
  let numConstrains = numConstrainsByJoint + eulerParameterConstrains;
  const matrix = math.zeros([numConstrains, 1], 'dense') as math.Matrix;

  const {assemblyMode} = store.getState().uigd.present.gdSceneState;
  if (assemblyMode === 'FixedFrame') {
    numConstrains += 6;
  }

  // 球ジョイントの拘束式
  joints.forEach((joint, r) => {
    // Φ = pl + Avl - pr - Avr
    const {lhs, rhs} = joint;
    const row = r * 3 + 0; // 一つの拘束で3つのスカラーを拘束
    if (!isElement(lhs.parent) || !isElement(rhs.parent)) {
      throw new Error('ジョイントの構成要素の親がElementでない');
    }
    const pLhs = lhs.parent.position.value;
    const sLhs = lhs.value.applyQuaternion(lhs.parent.rotation.value);

    const pRhs = rhs.parent.position.value;
    const sRhs = rhs.value.applyQuaternion(rhs.parent.rotation.value);
    const constrain = pLhs.add(sLhs).sub(pRhs).sub(sRhs);

    matrix.set([row + X, 0], constrain.x);
    matrix.set([row + Y, 0], constrain.y);
    matrix.set([row + Z, 0], constrain.z);
  });

  // フレームボディについては完全拘束する
  if (assemblyMode === 'FixedFrame') {
    // x=y=z=q1=q2=q3=0, q0=1←q0=1は正規化条件で出てくるので入れない。
    const frame = children.find((child) => isBodyOfFrame(child));
    if (!frame) throw new Error('フレームボディが見つからない');
    const row = numConstrainsByJoint;
    const p = frame.position.value;
    const q = frame.rotation.value;

    matrix.set([row + X, 0], p.x);
    matrix.set([row + Y, 0], p.y);
    matrix.set([row + Z, 0], p.z);
    matrix.set([row + Q1 - 1, 0], q.x);
    matrix.set([row + Q2 - 1, 0], q.y);
    matrix.set([row + Q3 - 1, 0], q.z);
  }

  // クォータニオンの正規化条件
  children.forEach((child, r) => {
    // Φ = q0^2 + q1^2 + q2^2 + q3^2 -1
    const q = child.rotation.value;

    const e0 = q.w;
    const e1 = q.x;
    const e2 = q.y;
    const e3 = q.z;
    const row = numConstrains - eulerParameterConstrains + r;
    matrix.set([row, 0], e0 * e0 + e1 * e1 + e2 * e2 + e3 * e3 - 1);
  });

  return matrix;
}

// 現在の一般化座標を求める。
export function getGeneralizedCoordinates(assembly: IAssembly): math.Matrix {
  const {children} = assembly;
  const numGeneralizedCoordinates = children.length * 7; // OKオイラーパラメータ4+XYZ

  const matrix = math.zeros(
    [numGeneralizedCoordinates, 1],
    'dense'
  ) as math.Matrix;

  children.forEach((child, r) => {
    const q = child.rotation.value;
    const p = child.position.value;

    const {x} = p;
    const {y} = p;
    const {z} = p;
    const e0 = q.w;
    const e1 = q.x;
    const e2 = q.y;
    const e3 = q.z;
    const row = r * 7;
    matrix.set([row + X, 0], x);
    matrix.set([row + Y, 0], y);
    matrix.set([row + Z, 0], z);
    matrix.set([row + Q0, 0], e0);
    matrix.set([row + Q1, 0], e1);
    matrix.set([row + Q2, 0], e2);
    matrix.set([row + Q3, 0], e3);
  });

  return matrix;
}

// 現在の一般化座標を反映する。
export function setGeneralizedCoordinates(
  assembly: IAssembly,
  matrix: math.Matrix
): void {
  const {children} = assembly;

  children.forEach((child, r) => {
    const e = child.rotation;
    const p = child.position;

    const row = r * 7;
    p.value = new Vector3(
      matrix.get([row + X, 0]),
      matrix.get([row + Y, 0]),
      matrix.get([row + Z, 0])
    );
    const q = new Quaternion(
      matrix.get([row + Q1, 0]),
      matrix.get([row + Q2, 0]),
      matrix.get([row + Q3, 0]),
      matrix.get([row + Q0, 0])
    );
    q.normalize();
    e.value = q;
  });
}

// 回転行列をQで偏微分したものを求める。
export function getPartialDiffOfRotationMatrix(
  q: Quaternion,
  v: Vector3
): math.Matrix {
  const e0 = q.w;
  const e1 = q.x;
  const e2 = q.y;
  const e3 = q.z;
  // const s = math.transpose(math.matrix([v.x, v.y, v.z]));
  const s = math.matrix([
    [0, v.z, -v.y],
    [-v.z, 0, v.x],
    [v.y, -v.x, 0]
  ]);
  const A = math.matrix([
    [
      4 * (e1 * e1 + e0 * e0 - 1 / 2),
      4 * (e1 * e2 - e0 * e3),
      4 * (e1 * e3 + e0 * e2)
    ],
    [
      4 * (e0 * e3 + e1 * e2),
      4 * (e2 * e2 + e0 * e0 - 1 / 2),
      4 * (e2 * e3 - e0 * e1)
    ],
    [
      4 * (e1 * e3 - e0 * e2),
      4 * (e2 * e3 + e0 * e1),
      4 * (e3 * e3 + e0 * e0 - 1 / 2)
    ]
  ]);
  const G = math.matrix([
    [-e1, e0, e3, -e2],
    [-e2, -e3, e0, e1],
    [-e3, e2, -e1, e0]
  ]);
  const Phi = math.multiply(A, s);
  const PhiG = math.multiply(Phi, G);
  return PhiG;
  /*
  const a_q = math.matrix([
    [4 * e0, -2 * e3, 2 * e2], // X行 e0列
    [2 * e3, 4 * e0, -2 * e1], // Y行 e0列
    [-2 * e2, 2 * e1, 4 * e0], // Z行 e0列
    [4 * e1, 2 * e2, 2 * e3],
    [2 * e2, 0, -2 * e0],
    [2 * e3, 2 * e0, 0],
    [0, 2 * e1, 2 * e0],
    [2 * e1, 4 * e2, 2 * e3],
    [-2 * e0, 2 * e3, 0],
    [0, -2 * e0, 2 * e1],
    [2 * e0, 0, 2 * e2],
    [2 * e1, 2 * e2, 4 * e3]
  ]);
  return math.transpose(math.reshape(math.multiply(a_q, s), [4, 3]));
  */
}

export function equal(
  lhs: math.Matrix,
  rhs: math.Matrix,
  eps = 1.0e-3
): [boolean, number | math.BigNumber] {
  const sub = math.subtract(lhs, rhs);
  const size = sub.size();
  const subT = math.reshape(sub, [size[0]]);
  const l = math.norm(subT);
  // eslint-disable-next-line no-console
  console.log(`norm:${l}`);
  return [l < eps, l];
}

export function svd(
  A: math.Matrix,
  options?: {
    eps?: number;
    beta?: number;
    maxIter?: number;
  }
): [number[], math.Matrix, math.Matrix] {
  const maxIter = options?.maxIter ? options.maxIter : 50;
  const beta = options?.beta ? options.beta : Number.MIN_VALUE;
  // beta is the smallest positive number representable in the computer.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MIN_VALUE
  let eps = options?.eps ? options.eps : Number.EPSILON; // the machine precision

  const tol = beta / eps;

  let [m, n] = A.size();

  // if m < n, the algorithms may be applied to At
  // At = (U Q Vt)t = V Q Ut
  const portrait = m >= n;
  const U = (
    portrait ? A.clone().valueOf() : math.transpose(A).valueOf()
  ) as number[][];
  if (!portrait) {
    [m, n] = [n, m];
  }

  const q = vZeros(n);
  const e = vZeros(n);
  const V = mZeros(n);

  // Householeder's reduction to bidiagonal form
  let g = 0;
  let x = 0;
  for (let i = 0; i < n; i++) {
    e[i] = g;
    let s = 0;
    const l = i + 1;
    for (let j = i; j < m; j++) {
      s += U[j][i] ** 2;
    }
    if (s < tol) {
      g = 0;
    } else {
      const f = U[i][i];
      g = f < 0 ? Math.sqrt(s) : -Math.sqrt(s);
      const h = f * g - s;
      U[i][i] = f - g;
      for (let j = l; j < n; j++) {
        let s = 0;
        for (let k = i; k < m; k++) {
          s += U[k][i] * U[k][j];
        }
        const f = s / h;
        for (let k = i; k < m; k++) {
          U[k][j] += f * U[k][i];
        }
      }
    }
    q[i] = g;
    s = 0;
    for (let j = l; j < n; j++) {
      s += U[i][j] ** 2;
    }
    if (s < tol) {
      // When l >= n, s is always 0.
      g = 0;
    } else {
      const f = U[i][l];
      g = f < 0 ? Math.sqrt(s) : -Math.sqrt(s);
      const h = f * g - s;
      U[i][l] = f - g;
      for (let j = l; j < n; j++) {
        e[j] = U[i][j] / h;
      }
      for (let j = l; j < m; j++) {
        let s = 0;
        for (let k = l; k < n; k++) {
          s += U[j][k] * U[i][k];
        }
        for (let k = l; k < n; k++) {
          U[j][k] += s * e[k];
        }
      }
    }
    const y = Math.abs(q[i]) + Math.abs(e[i]);
    if (y > x) x = y;
  }
  // accumulation of right-hand transformations
  for (let i = n - 1; i >= 0; i--) {
    const l = i + 1;
    if (g !== 0) {
      // When i = n - 1, g is always 0.
      const h = U[i][l] * g;
      for (let j = l; j < n; j++) {
        V[j][i] = U[i][j] / h;
      }
      for (let j = l; j < n; j++) {
        let s = 0;
        for (let k = l; k < n; k++) {
          s += U[i][k] * V[k][j];
        }
        for (let k = l; k < n; k++) {
          V[k][j] += s * V[k][i];
        }
      }
    }
    for (let j = l; j < n; j++) {
      V[i][j] = 0;
      V[j][i] = 0;
    }
    V[i][i] = 1;
    g = e[i];
  }
  // accumulation of left-hand transformations
  for (let i = n - 1; i >= 0; i--) {
    const l = i + 1;
    g = q[i];
    for (let j = l; j < n; j++) {
      U[i][j] = 0;
    }
    if (g !== 0) {
      const h = U[i][i] * g;
      for (let j = l; j < n; j++) {
        let s = 0;
        for (let k = l; k < m; k++) {
          s += U[k][i] * U[k][j];
        }
        const f = s / h;
        for (let k = i; k < m; k++) {
          U[k][j] += f * U[k][i];
        }
      }

      for (let j = i; j < m; j++) {
        U[j][i] /= g;
      }
    } else {
      for (let j = i; j < m; j++) {
        U[j][i] = 0;
      }
    }
    U[i][i] += 1;
  }

  // diagonalization of bidiagonal form
  eps *= x;
  for (let k = n - 1; k >= 0; k--) {
    let z = Infinity;
    let cnt = 0;
    while (++cnt) {
      // test f splitting
      let l;
      let convergence = false;
      for (l = k; l >= 0; l--) {
        if (Math.abs(e[l]) <= eps) {
          // e[0] is always 0.
          convergence = true;
          break;
        }
        if (Math.abs(q[l - 1]) <= eps) {
          break;
        }
      }
      // cancellation of e[l]
      if (!convergence) {
        let c = 0;
        let s = 1;
        const l1 = l - 1; // alyways l1 >= 0
        for (let i = l; i <= k; i++) {
          const f = s * e[i];
          e[i] *= c;
          if (Math.abs(f) <= eps) break;
          const g = q[i];
          const h = Math.sqrt(f ** 2 + g ** 2);
          q[i] = h;
          c = g / h;
          s = -f / h;

          for (let j = 0; j < m; j++) {
            const y = U[j][l1];
            const z = U[j][i];
            U[j][l1] = y * c + z * s;
            U[j][i] = -y * s + z * c;
          }
        }
      }
      // test f convergence
      z = q[k];
      if (l === k) break; // when k = 0, l is always 0.
      if (cnt >= maxIter) {
        throw new Error();
      }

      // shift from bottom 2*2 minor
      let x = q[l];
      let g = e[k - 1];
      const y = q[k - 1];
      const h = e[k];
      let f = ((y - z) * (y + z) + (g - h) * (g + h)) / (2 * h * y);
      g = Math.sqrt(f ** 2 + 1);
      f = ((x - z) * (x + z) + h * (y / (f < 0 ? f - g : f + g) - h)) / x;

      // next QR transformation
      let c = 1;
      let s = 1;
      for (let i = l + 1; i <= k; i++) {
        // k <= n - 1, l >= 0
        let g = e[i];
        let y = q[i];
        let h = s * g;
        g *= c;
        let z = Math.sqrt(f ** 2 + h ** 2);
        e[i - 1] = z;
        c = f / z;
        s = h / z;
        f = x * c + g * s;
        g = -x * s + g * c;
        h = y * s;
        y *= c;
        for (let j = 0; j < n; j++) {
          const x = V[j][i - 1];
          const z = V[j][i];
          V[j][i - 1] = x * c + z * s;
          V[j][i] = -x * s + z * c;
        }
        z = Math.sqrt(f ** 2 + h ** 2);
        q[i - 1] = z;
        c = f / z;
        s = h / z;
        f = c * g + s * y;
        x = -s * g + c * y;
        for (let j = 0; j < m; j++) {
          const y = U[j][i - 1];
          const z = U[j][i];
          U[j][i - 1] = y * c + z * s;
          U[j][i] = -y * s + z * c;
        }
      }
      e[l] = 0;
      e[k] = f;
      q[k] = x;
    }

    if (z < 0) {
      // q[k] is made non-negative
      q[k] = -z;
      for (let j = 0; j < n; j++) {
        V[j][k] *= -1;
      }
    }
  }
  return portrait
    ? [q, math.matrix(U), math.matrix(V)]
    : [q, math.matrix(V), math.matrix(U)];
}

const vZeros = (m: number): number[] => {
  if (m < 1) {
    throw new Error('m must be more than 0.');
  }
  return (Array(m) as number[]).fill(0);
};

const mZeros = (row: number, col?: number): number[][] => {
  if (row < 1) {
    throw new Error('row must be more than 0.');
  }
  if (col && col < 1) {
    throw new Error('col must be more than 0.');
  }
  const m = row;
  const n = col || row;

  const ret: number[][] = [];
  for (let i = 0; i < m; i++) {
    ret.push(vZeros(n));
  }
  return ret;
};

function multDiag(q: number[], m: math.Matrix) {
  const M = m.valueOf() as number[][];
  if (q.length !== M.length) throw new Error('あってない');
  q.forEach((x, i) => {
    const r = M[i];
    r.forEach((c, j) => {
      r[j] = c * x;
    });
  });
}
