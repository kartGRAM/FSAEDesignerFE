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
import {
  Matrix,
  solve,
  pseudoInverse,
  SingularValueDecomposition
} from 'ml-matrix';

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
  let qN = Matrix.zeros(numGeneralizedCoordinates, 1);
  let qN1 = Matrix.ones(numGeneralizedCoordinates, 1);
  const joints = assembly.getJointsAsVector3();

  const maxCnt = 100;
  let i = 0;
  let minNorm = Number.MAX_SAFE_INTEGER;
  let eq = false;
  while (!eq && ++i < maxCnt) {
    const phi_q = getKinematicJacobianMatrix(assembly, joints);
    const phi = getKinematicConstrainsVector(assembly, joints);
    const dq = new SingularValueDecomposition(phi_q, {
      autoTranspose: true
    }).solve(phi);

    // const dq = math.multiply(A, phi);

    qN = getGeneralizedCoordinates(assembly);
    qN1 = Matrix.sub(qN, dq);

    setGeneralizedCoordinates(assembly, qN1);
    let norm: number;
    [eq, norm] = equal(qN, qN1);
    if (norm > minNorm * 1000000000000000000000000000000) {
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
): Matrix {
  const {children} = assembly;
  const numConstrainsByJoint = joints.length * 3;
  const eulerParameterConstrains = children.length;
  let numConstrains = numConstrainsByJoint + eulerParameterConstrains;

  const {assemblyMode} = store.getState().uigd.present.gdSceneState;
  if (assemblyMode === 'FixedFrame') {
    numConstrains += 6;
  }
  const numGeneralizedCoordinates = children.length * 7; // OKオイラーパラメータ4+XYZ

  const matrix = Matrix.zeros(numConstrains, numGeneralizedCoordinates);

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
    matrix.set(row + X, colLhs + X, 1);
    matrix.set(row + Y, colLhs + Y, 1);
    matrix.set(row + Z, colLhs + Z, 1);
    matrix.set(row + X, colRhs + X, -1);
    matrix.set(row + Y, colRhs + Y, -1);
    matrix.set(row + Z, colRhs + Z, -1);
    // get Quaternion Parameters
    const qDiffLhs = getPartialDiffOfRotationMatrix(qLhs, vLhs);
    const qDiffRhs = getPartialDiffOfRotationMatrix(qRhs, vRhs);
    qDiffRhs.mul(-1);

    setSubMatrix(row + X, row + Z, colLhs + Q0, colLhs + Q3, matrix, qDiffLhs);
    setSubMatrix(row + X, row + Z, colRhs + Q0, colRhs + Q3, matrix, qDiffRhs);
  });

  // フレームボディについては完全拘束する
  if (assemblyMode === 'FixedFrame') {
    // x=y=z=q1=q2=q3=0, q0=1←q0=1は正規化条件で出てくるので入れない。
    const frame = children.find((child) => isBodyOfFrame(child));
    if (!frame) throw new Error('フレームボディが見つからない');
    const col = indices[frame.nodeID];
    const row = numConstrainsByJoint;

    matrix.set(row + X, col + X, 1);
    matrix.set(row + Y, col + Y, 1);
    matrix.set(row + Z, col + Z, 1);
    matrix.set(row + Q1 - 1, col + Q1, 1);
    matrix.set(row + Q2 - 1, col + Q2, 1);
    matrix.set(row + Q3 - 1, col + Q3, 1);
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
    matrix.set(row, col + Q0, 2 * e0);
    matrix.set(row, col + Q1, 2 * e1);
    matrix.set(row, col + Q2, 2 * e2);
    matrix.set(row, col + Q3, 2 * e3);
  });

  return matrix;
}

export function setSubMatrix(
  rowStart: number,
  rowEnd: number,
  columnStart: number,
  columnEnd: number,
  matrix: Matrix,
  submatrix: Matrix
) {
  for (let row = 0; row <= rowEnd - rowStart; ++row) {
    for (let col = 0; col <= columnEnd - columnStart; ++col) {
      matrix.set(row + rowStart, col + columnStart, submatrix.get(row, col));
    }
  }
}

// 拘束式の現在の値を求める。
export function getKinematicConstrainsVector(
  assembly: IAssembly,
  joints: JointAsVector3[]
): Matrix {
  const {children} = assembly;
  const numConstrainsByJoint = joints.length * 3;
  const eulerParameterConstrains = children.length;
  let numConstrains = numConstrainsByJoint + eulerParameterConstrains;

  const {assemblyMode} = store.getState().uigd.present.gdSceneState;
  if (assemblyMode === 'FixedFrame') {
    numConstrains += 6;
  }

  const matrix = Matrix.zeros(numConstrains, 1);

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

    matrix.set(row + X, 0, constrain.x);
    matrix.set(row + Y, 0, constrain.y);
    matrix.set(row + Z, 0, constrain.z);
  });

  // フレームボディについては完全拘束する
  if (assemblyMode === 'FixedFrame') {
    // x=y=z=q1=q2=q3=0, q0=1←q0=1は正規化条件で出てくるので入れない。
    const frame = children.find((child) => isBodyOfFrame(child));
    if (!frame) throw new Error('フレームボディが見つからない');
    const row = numConstrainsByJoint;
    const p = frame.position.value;
    const q = frame.rotation.value;

    matrix.set(row + X, 0, p.x);
    matrix.set(row + Y, 0, p.y);
    matrix.set(row + Z, 0, p.z);
    matrix.set(row + Q1 - 1, 0, q.x);
    matrix.set(row + Q2 - 1, 0, q.y);
    matrix.set(row + Q3 - 1, 0, q.z);
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
    matrix.set(row, 0, e0 * e0 + e1 * e1 + e2 * e2 + e3 * e3 - 1);
  });

  return matrix;
}

// 現在の一般化座標を求める。
export function getGeneralizedCoordinates(assembly: IAssembly): Matrix {
  const {children} = assembly;
  const numGeneralizedCoordinates = children.length * 7; // OKオイラーパラメータ4+XYZ

  const matrix = Matrix.zeros(numGeneralizedCoordinates, 1);

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
    matrix.set(row + X, 0, x);
    matrix.set(row + Y, 0, y);
    matrix.set(row + Z, 0, z);
    matrix.set(row + Q0, 0, e0);
    matrix.set(row + Q1, 0, e1);
    matrix.set(row + Q2, 0, e2);
    matrix.set(row + Q3, 0, e3);
  });

  return matrix;
}

// 現在の一般化座標を反映する。
export function setGeneralizedCoordinates(
  assembly: IAssembly,
  matrix: Matrix
): void {
  const {children} = assembly;

  children.forEach((child, r) => {
    const e = child.rotation;
    const p = child.position;

    const row = r * 7;
    p.value = new Vector3(
      matrix.get(row + X, 0),
      matrix.get(row + Y, 0),
      matrix.get(row + Z, 0)
    );
    const q = new Quaternion(
      matrix.get(row + Q1, 0),
      matrix.get(row + Q2, 0),
      matrix.get(row + Q3, 0),
      matrix.get(row + Q0, 0)
    );
    q.normalize();
    e.value = q;
  });
}

// 回転行列をQで偏微分したものを求める。
export function getPartialDiffOfRotationMatrix(
  q: Quaternion,
  v: Vector3
): Matrix {
  const e0 = q.w;
  const e1 = q.x;
  const e2 = q.y;
  const e3 = q.z;
  // const s = math.transpose(math.matrix([v.x, v.y, v.z]));
  const s = new Matrix([
    [0, v.z, -v.y],
    [-v.z, 0, v.x],
    [v.y, -v.x, 0]
  ]);
  const A = new Matrix([
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
  const G = new Matrix([
    [-e1, e0, e3, -e2],
    [-e2, -e3, e0, e1],
    [-e3, e2, -e1, e0]
  ]);
  const Phi = A.mmul(s).mmul(G);

  return Phi;
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
  lhs: Matrix,
  rhs: Matrix,
  eps = 1.0e-3
): [boolean, number] {
  const sub = lhs.sub(rhs);
  const l = sub.norm('frobenius');
  // eslint-disable-next-line no-console
  // console.log(`norm:${l}`);
  return [l < eps, l];
}
