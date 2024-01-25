/* eslint-disable camelcase */
import {
  isElement,
  isBodyOfFrame,
  IElement,
  isSimplifiedElement
} from '@gd/IElements';
import {JointAsVector3} from '@gd/IElements/IAssembly';
import {IAArm, isAArm} from '@gd/IElements/IAArm';
import {isBar} from '@gd/IElements/IBar';
import {ITire, isTire} from '@gd/IElements/ITire';
import {isSpringDumper} from '@gd/IElements/ISpringDumper';
import {isLinearBushing} from '@gd/IElements/ILinearBushing';
import {isTorsionSpring} from '@gd/IElements/ITorsionSpring';
import {INamedVector3RO} from '@gd/INamedValues';
import {Matrix} from 'ml-matrix';
import {Quaternion, Vector3} from 'three';
import {isVector3} from '@utils/three';
import {getDgd} from '@store/getDgd';
import {
  FullDegreesComponent,
  PointForce
} from '@gd/kinematics/KinematicComponents';
import {TireRestorer} from '@gd/kinematics/Restorer';

// サブマトリックスを設定する
/*
export function setSubMatrix(
  rowStart: number,
  columnStart: number,
  matrix: Matrix,
  submatrix: Matrix
) {
  for (let row = 0; row < submatrix.rows; ++row) {
    for (let col = 0; col < submatrix.columns; ++col) {
      matrix.set(row + rowStart, col + columnStart, submatrix.get(row, col));
    }
  }
}
*/

// チルダマトリックスを取得
export function skew(v: {x: number; y: number; z: number} | Matrix) {
  if ('x' in v) {
    return new Matrix([
      [0, v.z, -v.y],
      [-v.z, 0, v.x],
      [v.y, -v.x, 0]
    ]);
  }
  const x = v.get(0, 0);
  const y = v.get(1, 0);
  const z = v.get(2, 0);
  return new Matrix([
    [0, z, -y],
    [-z, 0, x],
    [y, -x, 0]
  ]);
}

declare module 'ml-matrix' {
  // matrixにsubmatrixAddを追加
  interface Matrix {
    subMatrixAdd(matrix: Matrix, startRow: number, startColumn: number): Matrix;
    subMatrixSub(matrix: Matrix, startRow: number, startColumn: number): Matrix;
  }
}

// eslint-disable-next-line func-names
Matrix.prototype.subMatrixAdd = function (
  matrix: Matrix,
  startRow: number,
  startColumn: number
) {
  const cols = matrix.columns;
  const {rows} = matrix;
  return this.setSubMatrix(
    this.subMatrix(
      startRow,
      startRow + rows - 1,
      startColumn,
      startColumn + cols - 1
    ).add(matrix),
    startRow,
    startColumn
  );
};

// eslint-disable-next-line func-names
Matrix.prototype.subMatrixSub = function (
  matrix: Matrix,
  startRow: number,
  startColumn: number
) {
  const cols = matrix.columns;
  const {rows} = matrix;
  return this.setSubMatrix(
    this.subMatrix(
      startRow,
      startRow + rows - 1,
      startColumn,
      startColumn + cols - 1
    ).sub(matrix),
    startRow,
    startColumn
  );
};

// const skewBase = skew({x: 1, y: 1, z: 1});

/* export function deltaXcross(y: Vector3 | Matrix) {
  if (isVector3(y)) return skewBase.mmul(getVVector(y));
  return skewBase.mmul(y);
} */

export function getDeltaOmega(
  v: Vector3,
  omega: Vector3,
  omegaSkew: Matrix,
  cogVehicle: Vector3,
  cogVehicleSkew: Matrix, // 2倍されている
  mass: number
) {
  const lhs = v.clone().add(omega.clone().cross(cogVehicle));
  const rhs = omegaSkew.mmul(cogVehicleSkew);
  return rhs.add(skew(lhs)).mul(-mass);
}

// (δX・a)bのヤコビアンを取得。
export function deltaXdotAmulB(a: Vector3 | Matrix, b: Vector3 | Matrix) {
  const A = (isVector3(a) ? getVVector(a) : a).transpose(); // (1x3)
  const B = isVector3(b) ? getVVector(b) : b; // (3x1)
  return B.mmul(A); // (3x3)
}

// 縦ベクトルを得る
export function getVVector(v: {x: number; y: number; z: number}) {
  return new Matrix([[v.x], [v.y], [v.z]]);
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

// 回転行列の部分分解行列を取得
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

// 二つのマトリックスを比較
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

// あるベクトルに垂直なベクトルを1つ取得
export function getStableOrthogonalVector(v: Vector3): Vector3 {
  const {x, y, z} = v;
  const a2 = [x ** 2, y ** 2, z ** 2];
  if (a2[0] + a2[1] + a2[2] <= Number.EPSILON) {
    throw new Error('ベクトルのノルムが小さすぎる');
  }
  const a = [x, y, z];
  const idx = [0, 1, 2];
  idx.sort((lhs, rhs) => a2[rhs] - a2[lhs]);

  const b = [0, 0, 0];
  b[idx[1]] = Math.sqrt(a2[idx[0]] / (a2[idx[0]] + a2[idx[1]]));
  b[idx[0]] = (-a[idx[1]] / a[idx[0]]) * b[idx[1]];
  return new Vector3(b[0], b[1], b[3]);
}

export type JointDict = {[index: string]: JointAsVector3[]};

// 拘束点がgetPointsの何番目か
export function getIndexOfPoint(element: IElement, v: INamedVector3RO) {
  const i = element
    .getMeasurablePoints()
    .findIndex((p) => p.nodeID === v.nodeID);
  if (i < 0) throw new Error('拘束点が見つからない');
  return i;
}
// jointの一意なID
export function getJointID(joint: JointAsVector3) {
  return `${joint.lhs.nodeID}&${joint.rhs.nodeID}`;
}

// ElementIDまたは拘束点をもとにJointを得る
export function getJointDictionary(
  children: IElement[],
  joints: JointAsVector3[]
) {
  const dictionary: JointDict = {};
  const add = (dict: JointDict, key: string, joint: JointAsVector3) => {
    if (!(key in dict)) dict[key] = [];
    dict[key].push(joint);
  };
  joints.forEach((joint) => {
    const {lhs, rhs} = joint;
    if (!isElement(lhs.parent)) return;
    if (!isElement(rhs.parent)) return;
    add(dictionary, lhs.parent.nodeID, joint);
    add(dictionary, rhs.parent.nodeID, joint);
    add(dictionary, lhs.nodeID, joint);
    add(dictionary, rhs.nodeID, joint);
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
  nodeID2?: string
): [INamedVector3RO, INamedVector3RO] {
  if (
    joint.lhs.parent?.nodeID === nodeID1 &&
    (joint.rhs.parent?.nodeID === nodeID2 ?? joint.rhs.parent?.nodeID)
  ) {
    return [joint.lhs, joint.rhs];
  }
  if (
    joint.rhs.parent?.nodeID === nodeID1 &&
    (joint.lhs.parent?.nodeID === nodeID2 ?? joint.lhs.parent?.nodeID)
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
  // 3点のみで構成されてない場合NG
  if (additionalPoints) return false;
  const fp = aArm.fixedPoints;
  // フレーム側の親を取得
  const parents = fp.map((p) => {
    const joint = jointDict[p.nodeID][0];
    return getJointPartner(joint, p.nodeID).parent as IElement;
  });
  // フレームが分割されていたりした場合はfalse;
  if (!parents[0] || !parents[1]) return false;
  if (parents[0].nodeID !== parents[1].nodeID) return false;

  const frame = parents[0];
  const pUpright = aArm.points[0];
  // アップライト側の親を取得
  const upright = getJointPartner(
    jointDict[pUpright.nodeID][0],
    pUpright.nodeID
  ).parent as IElement;

  if (isSimplifiedElement(frame)) return false;
  if (isSimplifiedElement(upright)) return false;
  if (isAArm(frame)) return false;
  if (isAArm(upright)) return false;
  return true;
}

// Tireを単純化できるか？
export function canSimplifyTire(element: ITire, jointDict: JointDict): boolean {
  const jointl = jointDict[element.leftBearing.nodeID][0];
  const jointr = jointDict[element.rightBearing.nodeID][0];
  const points = [
    getJointPartner(jointl, element.leftBearing.nodeID),
    getJointPartner(jointr, element.rightBearing.nodeID)
  ];
  const elements = points.map((p) => p.parent as IElement);
  // Tireの両端が同じコンポーネントに接続されている場合(通常の状態)であればタイヤは無視する。
  if (
    elements[0].nodeID === elements[1].nodeID ||
    (isFixedElement(elements[0]) && isFixedElement(elements[1]))
  ) {
    return true;
  }
  return false;
}

// アセンブリモードを得る
export function getAssemblyMode() {
  return getDgd().options.assemblyMode;
}

// 固定コンポーネントかを判定
export function isFixedElement(element: IElement) {
  const mode = getAssemblyMode();
  if (mode === 'FixedFrame') {
    if (isBodyOfFrame(element)) return true;
  }
  return false;
}

export function axisRotationFromQuaternion(q: Quaternion) {
  const {x, y, z, w} = q;
  return new Matrix([
    [1 - 2 * y ** 2 - 2 * z ** 2, 2 * x * y + 2 * w * z, 2 * x * z - 2 * w * y],
    [2 * x * y - 2 * w * z, 1 - 2 * x ** 2 - 2 * z ** 2, 2 * y * z + 2 * w * x],
    [2 * x * z - 2 * w * y, 2 * y * z - 2 * w * x, 1 - 2 * x ** 2 - 2 * y ** 2]
  ]);
}

export function elementIsComponent(
  element: IElement,
  jointDict: JointDict
): boolean {
  // AArmが単独で使わている場合は、BarAndSpheres2つに変更する。
  if (isAArm(element) && canSimplifyAArm(element, jointDict)) return false;
  // BarはComponent扱いしない
  if (isBar(element) || isSpringDumper(element)) return false;
  // Tireはコンポーネント扱いしない
  if (isTire(element) && canSimplifyTire(element, jointDict)) return false;
  // LinearBushingはコンポーネント扱いしない
  if (isLinearBushing(element)) return false;
  // TorsionSpringはコンポーネント扱いしない
  if (isTorsionSpring(element)) return false;
  // FixedElementはコンポーネント扱いしない
  if (isFixedElement(element)) return false;
  return true;
}

export function getSimplifiedTireConstrainsParams(
  element: ITire,
  jointDict: JointDict,
  tempComponents: {[index: string]: FullDegreesComponent},
  pID: string
): [FullDegreesComponent, (normal: Vector3, distance: number) => Vector3] {
  const plTo = getJointPartner(
    jointDict[element.leftBearing.nodeID][0],
    element.leftBearing.nodeID
  );
  const prTo = getJointPartner(
    jointDict[element.rightBearing.nodeID][0],
    element.rightBearing.nodeID
  ).value;
  const pl = element.leftBearing.value;
  const pr = element.rightBearing.value;
  // タイヤの親コンポーネントとの相対座標及び回転を取得
  const {position: dp, rotation: dq} = TireRestorer.getTireLocalPosition(
    pl,
    pr,
    plTo.value,
    prTo
  );
  const parent = plTo.parent as IElement;
  const pComponent = tempComponents[parent.nodeID];
  const dqi = dq.clone().invert();
  if (pID === 'nearestNeighbor') {
    const func = (normal: Vector3, distance: number) => {
      const pdqi = pComponent.quaternion.clone().invert();
      // タイヤ空間上へ法線方向を変換する
      const n = normal.clone().applyQuaternion(pdqi).applyQuaternion(dqi);
      // タイヤ空間内での、平面への最近傍点
      const point = element.getNearestNeighborToPlane(n, distance);
      return point.applyQuaternion(dq).add(dp);
    };
    return [pComponent, func];
  }
  const points = element.getMeasurablePoints();
  const point = points.find((point) => point.nodeID === pID);
  if (!point) throw new Error('pointが見つからない');
  const pLocal = point.value.applyQuaternion(dq).add(dp);
  const func = () => pLocal;
  return [pComponent, func];
}

export function getPFComponent(
  pointForceComponents: {[index: string]: PointForce},
  joint: JointAsVector3
): [PointForce, boolean] {
  const id = `${joint.lhs.nodeID}&${joint.rhs.nodeID}`;
  if (!pointForceComponents[id]) {
    const pf = new PointForce(joint.lhs, joint.rhs);
    pointForceComponents[id] = pf;
    return [pf, true];
  }
  return [pointForceComponents[id], false];
}
