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
import {Vector3, Quaternion} from 'three';
import {getDgd} from '@store/getDgd';
import {
  FullDegreesComponent,
  PointForce
} from '@gd/kinematics/KinematicComponents';
import {TireRestorer} from '@gd/kinematics/Restorer';
import {ITireData} from '@tire/ITireData';
import {IScalar} from '@computationGraph/IScalar';
import {IVector3} from '@computationGraph/IVector3';
import {ConstantVector3, Vector3 as CVector3} from '@computationGraph/Vector3';
import {IMatrix} from '@computationGraph/IMatrix';
import {Matrix as CMatrix} from '@computationGraph/Matrix';
import {VariableQuaternion} from '@computationGraph/VariableQuaternion';

export function getTireFriction(
  data: ITireData,
  sa: IScalar,
  sl: IScalar,
  ia: IScalar,
  fz: IScalar
): {friction: IVector3; mz: IVector3} {
  const reset = () => {
    sa.reset();
    ia.reset();
    fz.reset();
    sl.reset();
  };
  const friction = new CVector3(() => {
    const saV = sa.scalarValue;
    const iaV = ia.scalarValue;
    const fzV = fz.scalarValue;
    const slV = sl.scalarValue;
    const params = {sa: saV, ia: iaV, fz: fzV, sl: slV};
    const friction = data.friction(params);
    return {
      value: getVVector(friction), // (1x1)
      diff: (fromLhs: Matrix) => {
        sa.diff(fromLhs.clone().mmul(getVVector(data.dF_dSa(params))));
        sl.diff(fromLhs.clone().mmul(getVVector(data.dF_dSl(params))));
        ia.diff(fromLhs.clone().mmul(getVVector(data.dF_dIa(params))));
        fz.diff(fromLhs.clone().mmul(getVVector(data.dF_dFz(params))));
      }
    };
  }, reset);

  const mz = new CVector3(() => {
    const saV = sa.scalarValue;
    const iaV = ia.scalarValue;
    const fzV = fz.scalarValue;
    const slV = sl.scalarValue;
    const params = {sa: saV, ia: iaV, fz: fzV, sl: slV};
    const mz = data.mz(params);
    return {
      value: getVVector(new Vector3(0, 0, mz)), // (1x1)
      diff: (fromLhs: Matrix) => {
        sa.diff(fromLhs.clone().mul(data.dMz_dSa(params)));
        sl.diff(fromLhs.clone().mul(data.dMz_dSl(params)));
        ia.diff(fromLhs.clone().mul(data.dMz_dIa(params)));
        fz.diff(fromLhs.clone().mul(data.dMz_dFz(params)));
      }
    };
  }, reset);

  return {friction, mz};
}

// タイヤの軸に垂直で、地面に平行な前方向ベクトルkから、回転行列を作成
export function getFrictionRotation(normalizedParallel: IVector3): IMatrix {
  const dPhi_dkx = new Matrix([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 0]
  ]);

  const dPhi_dky = new Matrix([
    [0, -1, 0],
    [1, 0, 0],
    [0, 0, 0]
  ]);

  const x = new Matrix([[1, 0, 0]]);
  const y = new Matrix([[0, 1, 0]]);

  return new CMatrix(
    () => {
      const k = normalizedParallel.vector3Value;
      return {
        value: new Matrix([
          [k.x, -k.y, 0],
          [k.y, k.x, 0],
          [0, 0, 0]
        ]),
        diff: (fromLhs: Matrix, fromRhs?: Matrix) => {
          if (!fromRhs) throw new Error('ベクトルが必要');
          if (fromRhs.rows !== 3 || fromRhs.columns !== 1)
            throw new Error('Vector3じゃない');
          const lhs = fromLhs.mmul(dPhi_dkx).mmul(fromRhs).mmul(x); // (3x3)
          const rhs = fromLhs.mmul(dPhi_dky).mmul(fromRhs).mmul(y); // (3x3)
          const dPhi_dk = lhs.clone().add(rhs);
          normalizedParallel.diff(dPhi_dk);
        }
      };
    },
    () => {
      normalizedParallel.reset();
    }
  );
}

/*
// FrictionRotationMatrix φ に対して、δφ F
// φはkベクトルの関数とする
export function frictionRotationDiff(
  deltaNormarizedFrontVector: Matrix,
  F: Vector3
): Matrix {
  const dk = deltaNormarizedFrontVector;
  const Fv = getVVector(F);

  const dPhi_dkx = new Matrix([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 0]
  ]);

  const dPhi_dky = new Matrix([
    [0, -1, 0],
    [1, 0, 0],
    [0, 0, 0]
  ]);

  const dPhi_dkxF = dPhi_dkx.mmul(Fv); // (3x1)
  const dPhi_dkyF = dPhi_dky.mmul(Fv); // (3x1)
  const dkx = dk.subMatrix(0, 0, 0, dk.columns - 1);
  const dky = dk.subMatrix(1, 1, 0, dk.columns - 1);

  const lhs = dPhi_dkxF.mmul(dkx); // (3x1 x 1x n) = (3xn)
  const rhs = dPhi_dkyF.mmul(dky); // (3xn)

  return lhs.add(rhs);
} */

/* export function asinDiff(sin: number): number {
  return 180 / (Math.sqrt(1 - sin ** 2) * Math.PI);
  // return Math.PI / (Math.sqrt(1 - sin ** 2) * 180);
} */

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
    )
      .clone()
      .add(matrix),
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
    )
      .clone()
      .sub(matrix),
    startRow,
    startColumn
  );
};

export function getDeltaOmega(
  v: Vector3,
  omega: Vector3,
  omegaSkew: Matrix,
  cogVehicle: Vector3,
  cogVehicleSkew: Matrix,
  mass: number
) {
  const v2 = omega.clone().cross(cogVehicle);
  const lhs = skew(v.clone().add(v2));
  const rhs = omegaSkew.mmul(cogVehicleSkew);
  return rhs.add(lhs).mul(mass);
}

// 縦ベクトルを得る
export function getVVector(v: {x: number; y: number; z: number}) {
  return new Matrix([[v.x], [v.y], [v.z]]);
}

// 縦ベクトルを得る
export function getVector3(v: Matrix) {
  const x = v.get(0, 0);
  const y = v.get(1, 0);
  const z = v.get(2, 0);
  return new Vector3(x, y, z);
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

// 逆変換の部分分解行列を取得
export function decompositionMatrixE(q: Quaternion) {
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

// チルダマトリックスを取得
export function skew(v: {x: number; y: number; z: number} | Matrix) {
  if ('x' in v) {
    return new Matrix([
      [0, -v.z, v.y],
      [v.z, 0, -v.x],
      [-v.y, v.x, 0]
    ]);
  }
  const x = v.get(0, 0);
  const y = v.get(1, 0);
  const z = v.get(2, 0);
  return new Matrix([
    [0, -z, y],
    [z, 0, -x],
    [-y, x, 0]
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

  return A.mul(-2).mmul(s).mmul(G);
}

// 二つのマトリックスを比較
export function equal(
  lhs: Matrix,
  rhs: Matrix,
  eps = 1.0e-3
): [boolean, number] {
  const sub = lhs.clone().sub(rhs);
  const l = sub.norm('frobenius');
  // eslint-disable-next-line no-console
  console.log(`norm:${l}`);
  return [l < eps, l];
}

// あるベクトルに垂直なベクトルを1つ取得
export function getStableOrthogonalVector(v: {
  x: number;
  y: number;
  z: number;
}): Vector3 {
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
    joint.rhs.parent?.nodeID === (nodeID2 ?? joint.rhs.parent?.nodeID)
  ) {
    return [joint.lhs, joint.rhs];
  }
  if (
    joint.rhs.parent?.nodeID === nodeID1 &&
    joint.lhs.parent?.nodeID === (nodeID2 ?? joint.lhs.parent?.nodeID)
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
  const jointl = jointDict[element.outerBearing.nodeID][0];
  const jointr = jointDict[element.innerBearing.nodeID][0];
  const points = [
    getJointPartner(jointl, element.outerBearing.nodeID),
    getJointPartner(jointr, element.innerBearing.nodeID)
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

// エレメントがコンポーネントに変換されるか_
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

// 簡素化されたタイヤの親コンポーネントと、
// 最近傍点の親コンポーネント基準の位置ベクトルを得る
export function getSimplifiedTireConstrainsParams(
  element: ITire,
  jointDict: JointDict,
  tempComponents: {[index: string]: FullDegreesComponent},
  pID: string
): {
  pComponent: FullDegreesComponent;
  pComponentNodeID: string;
  groundLocalVec: (
    normal: IVector3,
    distance: IScalar,
    q: VariableQuaternion
  ) => IVector3;
} {
  const pOuter = getJointPartner(
    jointDict[element.outerBearing.nodeID][0],
    element.outerBearing.nodeID
  ).value;
  const pInner = getJointPartner(
    jointDict[element.innerBearing.nodeID][0],
    element.innerBearing.nodeID
  );
  const outer = element.toOuterBearing.value;
  const inner = element.toInnerBearing.value;

  const parent = pInner.parent as IElement;
  const pComponent = tempComponents[parent.nodeID];
  const {scale} = pComponent;

  if (pID === 'nearestNeighbor') {
    // 親コンポーネントのローカル空間上での回転軸
    const localAxis = new ConstantVector3(
      pOuter
        .clone()
        .sub(pInner.value)
        .multiplyScalar(outer - inner)
        .normalize()
    );
    // pOuter基準でのtireCenter
    const localTireCenter = new ConstantVector3(pOuter)
      .sub(localAxis.mul(outer))
      .mul(scale);

    const radius = element.radius * scale;

    const func = (
      normal: IVector3,
      distance: IScalar,
      q: VariableQuaternion
    ) => {
      const AT = q.getInvRotationMatrix();

      // 法線ベクトルを、部品座標系へ回転させる
      const n = AT.vmul(normal);

      // 地面に平行で前を向いたベクトルpara
      const para = localAxis.cross(n);

      // paraを正規化
      const k = para.normalize();

      // 地面方向を得る（長さは1なので正規化不要）
      const i = localAxis.cross(k);

      // タイヤ中心から地面までの変位
      const l = i.mul(radius);

      return localTireCenter.add(l);
    };

    return {
      pComponent,
      groundLocalVec: func,
      pComponentNodeID: parent.nodeID
    };
  }

  // タイヤの親コンポーネントとの相対座標及び回転を取得
  const pl = element.outerBearing.value;
  const pr = element.innerBearing.value;
  const {position: dp, rotation: dq} = TireRestorer.getTireLocalPosition(
    pl,
    pr,
    pOuter,
    pInner.value
  );
  dp.multiplyScalar(scale);
  const points = element.getMeasurablePoints();
  const point = points.find((point) => point.nodeID === pID);
  if (!point) throw new Error('pointが見つからない');
  const pLocal = point.value.multiplyScalar(scale).applyQuaternion(dq).add(dp);
  return {
    pComponent,
    groundLocalVec: () => new ConstantVector3(pLocal),
    pComponentNodeID: parent.nodeID
  };
}

// 簡素化されたタイヤの親コンポーネントと、
// 最近傍点の親コンポーネント基準の位置ベクトルを得る
/* export function getSimplifiedTireConstrainsParamsOld(
  element: ITire,
  jointDict: JointDict,
  tempComponents: {[index: string]: FullDegreesComponent},
  pID: string
): {
  pComponent: FullDegreesComponent;
  pComponentNodeID: string;
  groundLocalVec: (normal: Vector3) => {r: Vector3; dr_dQ: Matrix};
} {
  const pOuter = getJointPartner(
    jointDict[element.outerBearing.nodeID][0],
    element.outerBearing.nodeID
  ).value;
  const pInner = getJointPartner(
    jointDict[element.innerBearing.nodeID][0],
    element.innerBearing.nodeID
  );
  const outer = element.toOuterBearing.value;
  const inner = element.toInnerBearing.value;
  // 親コンポーネントのローカル空間上での回転軸
  const localAxis = pOuter
    .clone()
    .sub(pInner.value)
    .multiplyScalar(outer - inner);
  localAxis.normalize();
  const localAxisSkew = skew(localAxis);
  // pOuter基準でのtireCenter
  const localTireCenter = pOuter
    .clone()
    .sub(localAxis.clone().multiplyScalar(outer));

  const parent = pInner.parent as IElement;
  const pComponent = tempComponents[parent.nodeID];
  const {scale} = pComponent;
  localTireCenter.multiplyScalar(scale);
  const radius = element.radius * scale;

  if (pID === 'nearestNeighbor') {
    const func = (normal: Vector3) => {
      const q = pComponent.quaternion;
      const qi = q.clone().invert();
      const At = rotationMatrix(q).transpose();
      const E = decompositionMatrixE(q);
      // -2なのか？2じゃなくて？
      const globalNormalSkew = skew(normal).mul(2);

      // 法線ベクトルを、部品座標系へ回転させる
      const n = normal.clone().applyQuaternion(qi);
      const dn_dQ = At.mmul(globalNormalSkew).mmul(E);

      // 地面に平行で前を向いたベクトルpara
      const para = localAxis.clone().cross(n);
      const dPara_dQ = localAxisSkew.mmul(dn_dQ);

      // paraを正規化
      const k = para.clone().normalize();
      const dk_dQ = normalizedVectorDiff(para).mmul(dPara_dQ);

      // 地面方向を得る（長さは1なので正規化不要）
      const i = localAxis.clone().cross(k);
      const di_dQ = localAxisSkew.mmul(dk_dQ);

      // タイヤ中心から地面までの変位
      const l = i.clone().multiplyScalar(radius);
      const dl_dQ = di_dQ.clone().mul(radius);

      const r = localTireCenter.clone().add(l);
      const dr_dQ = dl_dQ;

      return {r, dr_dQ};
    };

    return {
      pComponent,
      groundLocalVec: func,
      pComponentNodeID: parent.nodeID
    };
  }

  // タイヤの親コンポーネントとの相対座標及び回転を取得
  const pl = element.outerBearing.value;
  const pr = element.innerBearing.value;
  const {position: dp, rotation: dq} = TireRestorer.getTireLocalPosition(
    pl,
    pr,
    pOuter,
    pInner.value
  );
  dp.multiplyScalar(scale);
  const points = element.getMeasurablePoints();
  const point = points.find((point) => point.nodeID === pID);
  if (!point) throw new Error('pointが見つからない');
  const pLocal = point.value.multiplyScalar(scale).applyQuaternion(dq).add(dp);
  const func = () => ({r: pLocal, dr_dQ: new Matrix(3, 4)});
  return {
    pComponent,
    groundLocalVec: func,
    pComponentNodeID: parent.nodeID
  };
}

export function getSimplifiedTireConstrainsParamsOld2(
  element: ITire,
  jointDict: JointDict,
  tempComponents: {[index: string]: FullDegreesComponent},
  pID: string
): {
  pComponent: FullDegreesComponent;
  pComponentNodeID: string;
  groundLocalVec: (normal: Vector3) => {r: Vector3; dr_dQ: Matrix};
} {
  const plTo = getJointPartner(
    jointDict[element.outerBearing.nodeID][0],
    element.outerBearing.nodeID
  );
  const prTo = getJointPartner(
    jointDict[element.innerBearing.nodeID][0],
    element.innerBearing.nodeID
  ).value;
  const pl = element.outerBearing.value;
  const pr = element.innerBearing.value;
  // タイヤの親コンポーネントとの相対座標及び回転を取得
  const {position: dp, rotation: dq} = TireRestorer.getTireLocalPosition(
    pl,
    pr,
    plTo.value,
    prTo
  );
  const parent = plTo.parent as IElement;
  const pComponent = tempComponents[parent.nodeID];
  const {scale} = pComponent;
  dp.multiplyScalar(scale);

  const dqi = dq.clone().invert();
  if (pID === 'nearestNeighbor') {
    const func = (normal: Vector3) => {
      const pdqi = pComponent.quaternion.clone().invert();
      // タイヤ空間上へ法線方向を変換する
      const n = normal.clone().applyQuaternion(pdqi).applyQuaternion(dqi);
      // タイヤ空間内での、平面への最近傍点
      const point = element
        .getNearestNeighborToPlane(n, 0)
        .clone()
        .multiplyScalar(scale);
      return {r: point.applyQuaternion(dq).add(dp), dr_dQ: new Matrix(3, 4)};
    };
    return {pComponent, groundLocalVec: func, pComponentNodeID: parent.nodeID};
  }
  const points = element.getMeasurablePoints();
  const point = points.find((point) => point.nodeID === pID);
  if (!point) throw new Error('pointが見つからない');
  const pLocal = point.value.multiplyScalar(scale).applyQuaternion(dq).add(dp);
  const func = () => ({r: pLocal, dr_dQ: new Matrix(3, 4)});
  return {pComponent, groundLocalVec: func, pComponentNodeID: parent.nodeID};
} */

// Jointから一つPFComponentを得る
export function getPFComponent(
  pointForceComponents: {[index: string]: PointForce},
  joint: JointAsVector3,
  scale: number
): [PointForce, boolean] {
  const id = `${joint.lhs.nodeID}&${joint.rhs.nodeID}`;
  if (!pointForceComponents[id]) {
    const pf = new PointForce(joint.lhs, joint.rhs, scale);
    pointForceComponents[id] = pf;
    return [pf, true];
  }
  return [pointForceComponents[id], false];
}
