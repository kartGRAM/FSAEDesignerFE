/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import {
  IAssembly,
  isElement,
  isBodyOfFrame,
  JointAsVector3,
  IAArm,
  isAArm,
  IElement,
  isSimplifiedElement
} from '@gd/IElements';
import {INamedVector3} from '@gd/INamedValues';
import {Matrix, SingularValueDecomposition} from 'ml-matrix';
import {Quaternion, Vector3} from 'three';
import store from '@store/store';

const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;
const Q1 = 4;
const Q2 = 5;
const Q3 = 6;

export function preProcess(assembly: IAssembly): void {
  const start = performance.now();
  const {children} = assembly;
  // コンポーネントのグルーピング、拘束式の簡略化などを行う

  const end = performance.now();
  // eslint-disable-next-line no-console
  console.log(`preProcessor: ${end - start}`);
}

export function postProcess(assembly: IAssembly): void {
  const start = performance.now();
  const {children} = assembly;
  // 得られた位置、クォータニオンを反映する

  const end = performance.now();
  // eslint-disable-next-line no-console
  console.log(`postProcessor: ${end - start}`);
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
  const q0 = getGeneralizedCoordinates(assembly);
  try {
    while (!eq && ++i < maxCnt) {
      const phi_q = getKinematicJacobianMatrix(assembly, joints);
      const phi = getKinematicConstrainsVector(assembly, joints);
      const dq = new SingularValueDecomposition(phi_q, {
        autoTranspose: true
      }).solve(phi);
      // dq.mul(0.1);

      // const dq = math.multiply(A, phi);

      qN = getGeneralizedCoordinates(assembly);
      qN1 = Matrix.sub(qN, dq);

      setGeneralizedCoordinates(assembly, qN1);
      let norm: number;
      [eq, norm] = equal(qN, qN1);
      if (norm > minNorm * 100) {
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
  } catch (e) {
    // エラーが生じたら元に戻す
    setGeneralizedCoordinates(assembly, q0);
    throw e;
  }
}

export function getKinematicConstrainedElementsWithMinimize() {}

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

    setSubMatrix(row + X, colLhs + Q0, matrix, qDiffLhs);
    setSubMatrix(row + X, colRhs + Q0, matrix, qDiffRhs);
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

// サブマトリックスを設定する
export function setSubMatrix(
  rowStart: number,
  columnStart: number,
  matrix: Matrix,
  submatrix: Matrix
) {
  for (let row = 0; row <= submatrix.rows; ++row) {
    for (let col = 0; col <= submatrix.columns; ++col) {
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

// チルダマトリックスを取得
export function skew(v: Vector3) {
  return new Matrix([
    [0, v.z, -v.y],
    [-v.z, 0, v.x],
    [v.y, -v.x, 0]
  ]);
}
// 回転行列を取得
export function rotationMatrix(q: Quaternion) {
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

// 回転行列を取得
export function decompositionMatrixG(q: Quaternion) {
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

// 回転行列をQで偏微分したものを求める。
export function getPartialDiffOfRotationMatrix(
  q: Quaternion,
  v: Vector3
): Matrix {
  const s = skew(v);
  const A = rotationMatrix(q);
  const G = decompositionMatrixG(q);

  // const s = math.transpose(math.matrix([v.x, v.y, v.z]));
  return A.mul(2).mmul(s).mmul(G);
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
  console.log(`norm:${l}`);
  return [l < eps, l];
}

export function getStableOrthogonalVector(v: Vector3): Vector3 {
  const {x, y, z} = v;
  const a = [x ** 2, y ** 2, z ** 2];
  if (a[0] + a[1] + a[2] <= Number.EPSILON) {
    throw new Error('ベクトルのノルムが小さすぎる');
  }
  const idx = [0, 1, 2];
  idx.sort((lhs, rhs) => a[lhs] - a[rhs]);

  const b = [0, 0, 0];
  b[idx[1]] = Math.sqrt(a[idx[0]] / (a[idx[0]] + a[idx[1]]));
  b[idx[0]] = Math.sqrt(1 - b[idx[1]] ** 2);
  return new Vector3(b[0], b[1], b[3]);
}

export type JointDict = {[index: string]: JointAsVector3[]};

// 拘束点がgetPointsの何番目か
export function getIndexOfPoint(element: IElement, v: INamedVector3) {
  const i = element.getPoints().findIndex((p) => p.nodeID === v.nodeID);
  if (i < 0) throw new Error('拘束点が見つからない');
  return i;
}

// ElementIDまたは拘束点をもとにJointを得る
export function getJointDictionary(
  children: IElement[],
  joints: JointAsVector3[]
) {
  const dictionary: JointDict = {};
  children.forEach((child) => {
    dictionary[child.nodeID] = [];
  });
  joints.forEach((joint) => {
    const {lhs, rhs} = joint;
    if (!isElement(lhs.parent)) return;
    if (!isElement(rhs.parent)) return;
    dictionary[lhs.parent.nodeID].push(joint);
    dictionary[rhs.parent.nodeID].push(joint);
    dictionary[lhs.nodeID].push(joint);
    dictionary[rhs.nodeID].push(joint);
  });
  return dictionary;
}

// Jointの相手を得る
export function getJointPartner(joint: JointAsVector3, nodeID: string) {
  if (joint.lhs.nodeID === nodeID) return joint.rhs;
  if (joint.rhs.nodeID === nodeID) return joint.lhs;
  if (joint.lhs.parent?.nodeID === nodeID) return joint.rhs;
  if (joint.rhs.parent?.nodeID === nodeID) return joint.lhs;
  throw new Error('相手が見つからない');
}

// JointをParent名で分解
export function getNamedVector3FromJoint(
  joint: JointAsVector3,
  nodeID1: string,
  nodeID2: string
): [INamedVector3, INamedVector3] {
  if (
    joint.lhs.parent?.nodeID === nodeID1 &&
    joint.rhs.parent?.nodeID === nodeID2
  ) {
    return [joint.lhs, joint.rhs];
  }
  if (
    joint.rhs.parent?.nodeID === nodeID1 &&
    joint.lhs.parent?.nodeID === nodeID2
  ) {
    return [joint.rhs, joint.lhs];
  }
  throw new Error('ノード名が不一致');
}

// 自分に関連したJointのArrayから、相手部品ごとのJointを得る
export function getJointsToOtherComponents(
  joints: JointAsVector3[],
  nodeID: string
): [string[], JointDict] {
  const dict = joints.reduce((prev, joint) => {
    const partner = getJointPartner(joint, nodeID).parent;
    if (isElement(partner)) {
      if (!(partner.nodeID in prev)) prev[partner.nodeID] = [];
      prev[partner.nodeID].push(joint);
    }
    return prev;
  }, {} as JointDict);
  const keys = Object.keys(dict);
  // 拘束の数が多い順に並べる
  keys.sort((a, b) => dict[b].length - dict[a].length);
  return [keys, dict];
}

// AArmをBar2つに変換できるか？
export function canSimplifyAArm(aArm: IAArm, jointDict: JointDict): boolean {
  const additionalPoints = aArm.points.length - 1;
  if (additionalPoints) return false;
  const fp = aArm.fixedPoints;
  const parents = fp.map((p) => {
    const joint = jointDict[p.nodeID][0];
    return getJointPartner(joint, p.nodeID).parent as IElement;
  });
  const pUpright = aArm.points[0];
  const upright = getJointPartner(
    jointDict[pUpright.nodeID][0],
    pUpright.nodeID
  ).parent as IElement;
  if (!parents[0] || !parents[1]) return false;

  if (parents[0].nodeID === parents[1].nodeID) {
    if (isSimplifiedElement(parents[0])) return false;
    if (isSimplifiedElement(upright)) return false;
    if (isAArm(parents[0])) return false;
    if (isAArm(upright)) return false;
    return true;
  }

  return false;
}

// アセンブリモードを得る
export function getAssemblyMode() {
  return store.getState().uigd.present.gdSceneState.assemblyMode;
}

// 固定コンポーネントかを判定
export function isFixedElement(element: IElement) {
  const mode = getAssemblyMode();
  if (mode === 'FixedFrame') {
    if (isBodyOfFrame(element)) return true;
  }
  return false;
}
