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
import {IAssembly, isElement, isBodyOfFrame} from '@gd/IElements';
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
    if (assembled) return;
    const start = performance.now();
    const assembly = store.getState().dgd.present.topAssembly;
    if (!assembled && assembly) {
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

export function getKinematicConstrainedElements(assembly: IAssembly): void {
  const {children} = assembly;
  const numGeneralizedCoordinates = children.length * 7; // OKオイラーパラメータ4+XYZ
  let dq = math.zeros([numGeneralizedCoordinates, 1]) as math.Matrix;
  const qN = math.zeros([numGeneralizedCoordinates, 1]) as math.Matrix;
  const qN1 = math.ones([numGeneralizedCoordinates, 1]) as math.Matrix;
  while (!equal(qN, qN1)) {
    const phi_q = getKinematicJacobianMatrix(assembly);
    const phi = getKinematicConstrainsVector(assembly);
    const size = phi_q.size();

    if (size[0] === size[1]) {
      // 正方行列なので普通に求める
      dq = math.lusolve(phi_q, phi);
    } else if (size[0] < size[1]) {
      // 行フルランクだとして疑似逆行列を求める
      const phi_qt = math.transpose(phi_q);
      const phi_qDotphi_qt = math.multiply(phi_q, phi_qt);
      const lambda = math.lusolve(phi_qDotphi_qt, phi);
      dq = math.multiply(phi_qt, lambda);
    } else {
      // eslint-disable-next-line no-console
      console.log('過剰拘束になっている');
      return;
    }
  }
}

// 拘束式のヤコビアンを求める。
export function getKinematicJacobianMatrix(assembly: IAssembly): math.Matrix {
  const joints = assembly.getJointsAsVector3();
  const {children} = assembly;
  const numConstrainsByJoint = joints.length * 3;
  const eulerParameterConstrains = children.length;
  let numConstrains = numConstrainsByJoint + eulerParameterConstrains;

  const {assemblyMode} = store.getState().uigd.present.gdSceneState;
  if (assemblyMode === 'FixedFrame') {
    numConstrains += 6;
  }
  const numGeneralizedCoordinates = children.length * 7; // OKオイラーパラメータ4+XYZ

  const matrix = math.zeros([
    numConstrains,
    numGeneralizedCoordinates
  ]) as math.Matrix;

  const indices = children.reduce(
    (prev: {[index: string]: number}, current, idx) => {
      prev[current.nodeID] = idx;
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
      math.index([row + X, row + Z], [colLhs + Q0, colLhs + Q3]),
      qDiffLhs
    );
    matrix.subset(
      math.index([row + X, row + Z], [colRhs + Q0, colRhs + Q3]),
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
export function getKinematicConstrainsVector(assembly: IAssembly): math.Matrix {
  const joints = assembly.getJointsAsVector3();
  const {children} = assembly;
  const numConstrainsByJoint = joints.length * 3;
  const eulerParameterConstrains = children.length;
  let numConstrains = numConstrainsByJoint + eulerParameterConstrains;
  const matrix = math.zeros([numConstrains, 1]) as math.Matrix;

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

    matrix.set([row + X, 1], constrain.x);
    matrix.set([row + Y, 1], constrain.y);
    matrix.set([row + Z, 1], constrain.z);
  });

  // フレームボディについては完全拘束する
  if (assemblyMode === 'FixedFrame') {
    // x=y=z=q1=q2=q3=0, q0=1←q0=1は正規化条件で出てくるので入れない。
    const frame = children.find((child) => isBodyOfFrame(child));
    if (!frame) throw new Error('フレームボディが見つからない');
    const row = numConstrainsByJoint;
    const p = frame.position.value;
    const q = frame.rotation.value;

    matrix.set([row + X, 1], p.x);
    matrix.set([row + Y, 1], p.y);
    matrix.set([row + Z, 1], p.z);
    matrix.set([row + Q1 - 1, 1], q.x);
    matrix.set([row + Q2 - 1, 1], q.y);
    matrix.set([row + Q3 - 1, 1], q.z);
  }

  // クォータニオンの正規化条件
  children.forEach((child, r) => {
    // Φ = q0^2 + q1^2 + q2^2 + q3^2
    const q = child.rotation.value;

    const e0 = q.w;
    const e1 = q.x;
    const e2 = q.y;
    const e3 = q.z;
    const row = numConstrains - eulerParameterConstrains + r;
    matrix.set([row, 1], e0 * e0 + e1 * e1 + e2 * e2 + e3 * e3);
  });

  return matrix;
}

// 現在の一般化座標を求める。
export function getGeneralizedCoordinates(assembly: IAssembly): math.Matrix {
  const {children} = assembly;
  const numGeneralizedCoordinates = children.length * 7; // OKオイラーパラメータ4+XYZ

  const matrix = math.zeros([numGeneralizedCoordinates, 1]) as math.Matrix;

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
    matrix.set([row + X, 1], x);
    matrix.set([row + Y, 1], y);
    matrix.set([row + Z, 1], z);
    matrix.set([row + Q0, 1], e0);
    matrix.set([row + Q1, 1], e1);
    matrix.set([row + Q2, 1], e2);
    matrix.set([row + Q3, 1], e3);
  });

  return matrix;
}

// 現在の一般化座標を反映する。
export function setGeneralizedCoordinates(
  assembly: IAssembly,
  q: math.Matrix
): void {
  const {children} = assembly;
  const numGeneralizedCoordinates = children.length * 7; // OKオイラーパラメータ4+XYZ

  const matrix = math.zeros([numGeneralizedCoordinates, 1]) as math.Matrix;

  children.forEach((child, r) => {
    const e = child.rotation;
    const p = child.position;

    const row = r * 7;
    p.value = new Vector3(
      matrix.get([row + X, 1]),
      matrix.get([row + Y, 1]),
      matrix.get([row + Z, 1])
    );
    e.value = new Quaternion(
      matrix.get([row + Q1, 1]),
      matrix.get([row + Q2, 1]),
      matrix.get([row + Q3, 1]),
      matrix.get([row + Q0, 1])
    );
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
  const s = math.transpose(math.matrix([v.x, v.y, v.z]));
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
}

export function equal(
  lhs: math.Matrix,
  rhs: math.Matrix,
  eps = 1.0e-5
): boolean {
  const l = math.norm(math.subtract(lhs, rhs));
  return l < eps;
}
