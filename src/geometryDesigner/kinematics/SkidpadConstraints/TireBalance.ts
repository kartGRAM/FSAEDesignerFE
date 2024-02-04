/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {Matrix} from 'ml-matrix';
import {Vector3, Quaternion} from 'three';
import {Twin} from '@utils/atLeast';
import {ITire} from '@gd/IElements/ITire';
import {
  skew,
  rotationMatrix,
  decompositionMatrixG,
  getDeltaOmega,
  getFrictionRotation,
  // deltaXcross,
  getVVector,
  getVector3,
  asinDiff,
  frictionRotationDiff,
  normalizedVectorDiff
} from '../KinematicFunctions';
import {
  IComponent,
  IVariable,
  FullDegreesComponent,
  PointForce,
  GeneralVariable
} from '../KinematicComponents';
import {Constraint} from '../Constraints';
import {Balance} from '../SkidpadConstraints';

const X = 0;
const Y = 1;
const Z = 2;
const Q0 = 3;

const normal = new Vector3(0, 0, 1);
const unitZ = getVVector(new Vector3(0, 0, 1));
const unitZT = unitZ.transpose();
const unitZSkew = skew(new Vector3(0, 0, 1));
const nnT = unitZ.mmul(unitZT);

export class TireBalance implements Constraint, Balance {
  static className = 'TireBalance' as const;

  readonly className = TireBalance.className;

  // 並進運動+回転
  constraints() {
    return 5;
  }

  active() {
    return true;
  }

  resetStates(): void {}

  readonly isInequalityConstraint = false;

  row: number = -1;

  name: string;

  pfs: Twin<PointForce>;

  error: GeneralVariable;

  component: IComponent;

  element: ITire;

  relevantVariables: IVariable[];

  localVec: Twin<Vector3>;

  localSkew: Twin<Matrix>;

  cog: number;

  g: Vector3;

  mass: number;

  vO: () => Vector3;

  omega: GeneralVariable;

  ground: () => {r: Vector3; dr_dQ: Matrix}; // コンポーネント座標系における接地点

  getFriction: (sa: number, ia: number, fz: number) => Vector3;

  getFrictionDiff: (
    sa: number,
    ia: number,
    fz: number
  ) => {saDiff: Matrix; iaDiff: Matrix; fzDiff: Matrix};

  torqueRatio: number; // 駆動輪の駆動力配分

  localAxis: Vector3;

  localAxisSkew: Matrix;

  localCog: Vector3;

  cogLocalSkew: Matrix;

  pfCoefs: Twin<number>; // ジョイント部分を作用反作用どちらで使うか

  disableTireFriction: boolean = false;

  tireRadius: number; // タイヤ半径

  constructor(params: {
    name: string;
    component: FullDegreesComponent;
    element: ITire;
    points: Twin<Vector3>; // Component基準
    mass: number;
    cog: number;
    pfs: Twin<PointForce>; // Bearing部分
    pfsPointNodeIDs: Twin<string>; // ジョイント部分のローカルベクトルのノードID 作用反作用で定義
    vO: () => Vector3; // 座標原点の速度
    omega: GeneralVariable; // 座標原点の角速度
    torqueRatio: number;
    getFriction: (sa: number, ia: number, fz: number) => Vector3; // タイヤの発生する力
    getFrictionDiff: (
      sa: number,
      ia: number,
      fz: number
    ) => {saDiff: Matrix; iaDiff: Matrix; fzDiff: Matrix};
    error: GeneralVariable;
    ground: () => {r: Vector3; dr_dQ: Matrix}; // コンポーネント座標系における接地点
    tireRadius: number; // タイヤ半径
  }) {
    const {
      name,
      component,
      element,
      mass,
      cog,
      points, // Component基準
      pfs, // Bearing部分
      error,
      torqueRatio,
      vO,
      ground,
      getFriction, // タイヤの発生する力
      getFrictionDiff,
      tireRadius,
      omega // 座標原点の角速度
    } = params;

    this.name = name;
    this.component = component;
    this.element = element;
    this.cog = cog;
    this.pfs = [...pfs];
    this.pfCoefs = this.pfs.map((pf, i) =>
      pf.sign(params.pfsPointNodeIDs[i])
    ) as Twin<number>;
    this.error = error;
    this.mass = mass;
    this.torqueRatio = torqueRatio;
    this.tireRadius = tireRadius * this.component.scale;
    this.omega = omega;

    this.g = new Vector3(0, 0, -9810 * this.component.scale);

    this.relevantVariables = [
      this.component,
      this.omega,
      this.error,
      ...this.pfs
    ];
    const {scale} = this.component;
    this.getFriction = getFriction;
    this.getFrictionDiff = getFrictionDiff;
    this.vO = vO;
    this.ground = ground;

    this.localVec = points.map((p) =>
      p.clone().multiplyScalar(scale)
    ) as Twin<Vector3>;
    this.localSkew = this.localVec.map((p) => skew(p).mul(-2)) as Twin<Matrix>;

    this.localAxis = this.localVec[1].clone().sub(this.localVec[0]).normalize();
    this.localAxisSkew = skew(this.localAxis).mul(-2);

    this.localCog = this.localVec[1]
      .clone()
      .sub(this.localVec[0])
      .multiplyScalar(this.cog)
      .add(this.localVec[0]);
    this.cogLocalSkew = skew(this.localCog).mul(-2);

    const para = this.localAxis.clone().cross(normal);
    if (para.dot(new Vector3(1, 0, 0)) < 0) {
      this.localAxis.multiplyScalar(-1);
      this.localAxisSkew = this.localAxisSkew.clone().mul(-1);
    }
  }

  setJacobianAndConstraints(phi_q: Matrix, phi: number[]) {
    const {row, localVec, localSkew, pfs, error, torqueRatio} = this;
    const {component, pfCoefs, cogLocalSkew} = this;

    // 重心とか接地点とか軸とか
    const {pGround, groundQ, cogQ, axis, localGroundSkew, A, G, q, pCog} =
      this.getTireVectorParams();
    const pQ = localVec.map((p) => p.clone().applyQuaternion(q));
    const pSkewQ = pQ.map((p) => skew(p));
    const groundSkewQ = skew(groundQ);

    // 重心のSkewMatrix
    const cogSkewP = skew(pCog);
    const cogSkewQ = skew(cogQ);

    // 慣性力など
    const {
      ma,
      omegaSkew,
      omega,
      vO,
      friction,
      frictionX,
      fz,
      k,
      dk_dQ,
      dFtR_df,
      dFtR_dOmega,
      dFtR_dP,
      dFtR_dQ,
      dFtx_dOmega,
      dFtx_dP,
      dFtx_dQ,
      dFtx_df
    } = this.getTireVectors({
      pGround,
      axis,
      localGroundSkew,
      A,
      G,
      q,
      pCog
    });
    const maSkew = skew(ma); // (3x3)
    const omegaSkew2 = omegaSkew.mmul(omegaSkew); // (3x3)
    const frictionSkew = skew(friction);

    // 誤差項
    const fe = k.clone().multiplyScalar(torqueRatio * error.value);
    const feSkew = skew(fe);

    const {mX, dMX_dOmega, dMX_de, dMX_df, dMX_dP, dMX_dQ} =
      this.getDriveMoment({
        frictionX,
        dFtx_dOmega,
        dFtx_dP,
        dFtx_dQ,
        dFtx_df,
        axis,
        A,
        G
      });
    // console.log(mX);

    // 力のつり合い
    const translation = pfs
      .reduce(
        (prev, pf, i) => prev.add(pf.force.clone().multiplyScalar(pfCoefs[i])),
        new Vector3()
      )
      .add(ma)
      .add(fz)
      .add(friction)
      .add(fe);

    // 部品原点まわりのモーメントつり合い
    // 変分の方程式がわかりやすくなるようにあえて、力x距離にする
    const rotation = pfs
      .reduce(
        (prev, pf, i) =>
          prev.add(
            pf.force
              .clone()
              .multiplyScalar(pfCoefs[i])
              .cross(pQ[i])
              .add(new Vector3(0, 0, -pf.force.z * pfCoefs[i]).cross(groundQ))
          ),
        new Vector3()
      )
      .add(ma.clone().cross(cogQ))
      .add(new Vector3(0, 0, -ma.z).cross(groundQ))
      .add(friction.clone().add(fe).cross(groundQ))
      .add(mX);

    phi[row + X] = translation.x;
    phi[row + Y] = translation.y;
    // phi[row + Z] = translation.z;
    phi[row + 2 + X] = rotation.x;
    phi[row + 2 + Y] = rotation.y;
    phi[row + 2 + Z] = rotation.z;

    // 力のつり合い
    // dF
    const df = Matrix.eye(3, 3).add(dFtR_df);
    pfs.forEach((pf, i) => {
      phi_q.subMatrixAdd(
        df.subMatrix(0, 1, 0, 2).clone().mul(pfCoefs[i]),
        row,
        pf.col
      );
    });

    // dω
    const dOmegaByCentrifugal = getDeltaOmega(
      vO,
      omega,
      omegaSkew,
      pCog,
      cogSkewP,
      this.mass
    ).mmul(unitZ);
    const dOmega1 = dOmegaByCentrifugal.clone();
    dOmega1.add(dFtR_dOmega);
    phi_q.subMatrixAdd(dOmega1.subMatrix(0, 1, 0, 0), row, this.omega.col);

    // dP
    const dP1 = omegaSkew2.clone().mul(-this.mass);
    dP1.add(dFtR_dP);
    phi_q.subMatrixAdd(dP1.subMatrix(0, 1, 0, 2), row, component.col + X);

    // dΘ
    const dThetaMF = omegaSkew2.mmul(A).mmul(cogLocalSkew).mul(-this.mass);
    const dThetaMError = dk_dQ.clone().mul(torqueRatio * error.value);
    const dTheta = dThetaMF.mmul(G);
    dTheta.add(dThetaMError);
    dTheta.add(dFtR_dQ);
    phi_q.subMatrixAdd(dTheta.subMatrix(0, 1, 0, 3), row, component.col + Q0);

    // de
    const de = getVVector(k).mul(torqueRatio);
    phi_q.subMatrixAdd(de.subMatrix(0, 1, 0, 0), row, error.col);

    // モーメントのつり合い
    // df
    pfs.forEach((pf, i) => {
      const df2 = groundSkewQ.mmul(nnT).sub(pSkewQ[i]).mul(pfCoefs[i]);
      df2.add(groundSkewQ.mmul(dFtR_df).mul(-pfCoefs[i]));
      phi_q.subMatrixAdd(df2, row + 2, pf.col);
    });

    // dΘ
    // 自明な部分
    const dThetaM = new Matrix(3, 3);
    pfs.forEach((pf, i) => {
      const fSkew = skew(pf.force).mul(pfCoefs[i]); // (3x3)
      dThetaM.add(fSkew.mmul(A).mmul(localSkew[i]));
      const fzSkew = skew(nnT.mmul(getVVector(pf.force))).mul(-pfCoefs[i]); // (3x3)
      dThetaM.add(fzSkew.mmul(A).mmul(localGroundSkew));
    });
    dThetaM.add(maSkew.mmul(A).mmul(cogLocalSkew));
    const mazSkew = skew(nnT.mmul(getVVector(ma))).mul(-1); // (3x3)
    dThetaM.add(mazSkew.mmul(A).mmul(localGroundSkew));
    dThetaM.add(frictionSkew.clone().add(feSkew).mmul(A).mmul(localGroundSkew));

    // maの中の遠心力の位置座標のQの寄与分: -ωｘ(ωx(p+Acog))のＡの微分
    const temp = groundSkewQ.mmul(nnT).sub(cogSkewQ);
    dThetaM.add(
      temp.mmul(omegaSkew2).mmul(A).mmul(cogLocalSkew).mul(-this.mass)
    );
    // 残り（駆動力の中の分やerrorの中の分）
    const dTheta2 = dThetaM.mmul(G);
    dTheta2.sub(groundSkewQ.mmul(dFtR_dQ));
    dTheta2.sub(groundSkewQ.mmul(dThetaMError));
    phi_q.subMatrixAdd(dTheta2, row + 2, component.col + Q0);

    // dP
    const dP2 = temp.mmul(omegaSkew2).mul(-this.mass);
    dP2.sub(groundSkewQ.mmul(dFtR_dP));
    phi_q.subMatrixAdd(dP2, row + 2, component.col + X);

    // dω
    const dOmega2 = temp.mmul(dOmegaByCentrifugal);
    dOmega2.sub(groundSkewQ.mmul(dFtR_dOmega));
    phi_q.subMatrixAdd(dOmega2, row + 2, this.omega.col);

    // de
    const de2 = groundSkewQ.mmul(de).mul(-1);
    phi_q.subMatrixAdd(de2, row + 2, this.error.col);

    // 駆動力による微分
    pfs.forEach((pf, i) => {
      phi_q.subMatrixAdd(dMX_df[i], row + 2, pf.col + X);
    });
    phi_q.subMatrixAdd(dMX_dP, row + 2, component.col + X);
    phi_q.subMatrixAdd(dMX_dQ, row + 2, component.col + Q0);
    phi_q.subMatrixAdd(dMX_de, row + 2, error.col);
    phi_q.subMatrixAdd(dMX_dOmega, row + 2, this.omega.col);
  }

  getTireVectorParams() {
    const {localAxis, localCog} = this;
    const q = this.component.quaternion;
    const {position} = this.component;
    // 接地点
    const {r: ground, dr_dQ: dGround_dQ} = this.ground();
    const localGroundSkew = skew(ground).mul(-2);
    const groundQ = ground.clone().applyQuaternion(q);
    const pGround = groundQ.clone().add(position);
    // console.log(`pGround= ${pGround.z}`);
    // console.log(`cog= ${localCog.z}`);
    // pGround.z = 0;

    // 重心
    const cogQ = localCog.clone().applyQuaternion(q);
    const pCog = cogQ.clone().add(position); // 車両座標系

    // 回転行列
    const A = rotationMatrix(q);
    const G = decompositionMatrixG(q);
    const axis = localAxis.clone().applyQuaternion(q);

    // const radius = pGround.clone().sub(pCog);
    // console.log(`radius= ${radius.length()}`);

    return {pGround, axis, localGroundSkew, A, G, q, pCog, cogQ, groundQ};
  }

  getTireVectors(params?: {
    pGround: Vector3;
    axis: Vector3;
    localGroundSkew: Matrix;
    A: Matrix;
    G: Matrix;
    q: Quaternion;
    pCog: Vector3;
  }) {
    const {pGround, axis, localGroundSkew, A, G, pCog} =
      params ?? this.getTireVectorParams();
    const {localAxisSkew, pfs, pfCoefs, g} = this;

    // 慣性力
    const omega = new Vector3(0, 0, this.omega.value);
    const omegaSkew = skew(omega); // 角速度のSkewMatrix(3x3)
    const vO = this.vO(); // 車速(m/s)
    const cO = omega.clone().cross(vO).multiplyScalar(-1); // 車両座標系にかかる原点の遠心力
    // const c02 = omegaSkew.mmul(getVVector(vO)).mul(-1);

    const c = omega
      .clone()
      .cross(omega.clone().cross(pCog))
      .multiplyScalar(-1)
      .add(cO);
    const ma = g.clone().add(c).multiplyScalar(this.mass); // 遠心力＋重力

    const groundSkewP = skew(pGround);
    // 接地点の速度
    const vOmega = omega.clone().cross(pGround);
    const vGround = vO.clone().add(vOmega);
    // vGround.z = 0; // 念のため
    const dvG_dOmega = groundSkewP.mmul(unitZ).mul(-1); // (3x1)
    const dvG_dP = omegaSkew.clone(); // (3x3)
    const dvG_dQ = omegaSkew.mmul(A).mmul(localGroundSkew).mmul(G); // (3x4)
    const vGn = vGround.clone().normalize();
    const vGnSkew = skew(vGn);
    const dvGn_dvG = normalizedVectorDiff(vGround); // (3x3)
    const dvGn_dOmega = dvGn_dvG.mmul(dvG_dOmega); // (3x1)
    const dvGn_dP = dvGn_dvG.mmul(dvG_dP); // (3x3)
    const dvGn_dQ = dvGn_dvG.mmul(dvG_dQ); // (3x4)

    // SAとIAとFZを求める
    // axisに垂直で地面に平行なベクトル(Vの方向を向いている)
    const para = axis.clone().cross(normal);
    if (para.dot(vGround) < 0) {
      throw new Error('ベクトルの向きが逆になった');
    }
    const dPara_dQ = unitZSkew.mmul(A).mmul(localAxisSkew).mmul(G).mul(-1); // (3x4)
    const k = para.clone().normalize(); // 長さ1
    const kSkew = skew(k); // (3x3)
    const dk_dPara = normalizedVectorDiff(para); // (3x3)
    const dk_dQ = dk_dPara.mmul(dPara_dQ); // (3x3) * (3x4) = (3x4)

    // sin(sa) の取得
    const sinSa = normal.dot(k.clone().cross(vGn));
    const dsinSa_dQ1 = unitZT.mmul(vGnSkew).mmul(dk_dQ).mul(-1); // (1x3) * (3x3) * (3x4) = (1x4)
    const dsinSa_dOmega = unitZT.mmul(kSkew).mmul(dvGn_dOmega); // (1x3) * (3x3) * (3x1) = (1x1)
    const dsinSa_dP = unitZT.mmul(kSkew).mmul(dvGn_dP); // (1x3) * (3x3) * (3x3) = (1x3)
    const dsinSa_dQ2 = unitZT.mmul(kSkew).mmul(dvGn_dQ); // (1x3) * (3x3) * (3x4) = (1x4)
    const dsinSa_dQ = dsinSa_dQ1.clone().add(dsinSa_dQ2); // (1x4)

    // sa の取得
    const sa = (Math.asin(sinSa) * 180) / Math.PI;
    const dsa_dsinSa = asinDiff(sinSa);
    const dSa_dOmega = dsinSa_dOmega.clone().mul(dsa_dsinSa); // (1x1)
    const dSa_dP = dsinSa_dP.clone().mul(dsa_dsinSa); // (1x3)
    const dSa_dQ = dsinSa_dQ.clone().mul(dsa_dsinSa); // (1x4)

    // iaの取得
    const tireVirtical = axis.clone().cross(k).normalize();
    const iaSin = tireVirtical.clone().cross(normal).dot(k);
    let ia = (Math.asin(iaSin) * 180) / Math.PI;
    ia = 0; // iaの求め方がおかしい

    // fzの取得
    // normal方向成分を求める
    const fz = pfs
      .reduce((prev, current, i) => {
        return prev.add(new Vector3(0, 0, -current.force.z * pfCoefs[i]));
      }, new Vector3())
      .add(new Vector3(0, 0, -ma.z));
    if (fz.z < 0) {
      throw new Error('Fzが負になった');
    }
    const dfz_df = unitZT.clone().mul(-1);

    // タイヤの摩擦力の取得
    const frictionOrg = this.getFriction(sa, ia, fz.z); // この値はタイヤが垂直の時の座標系
    const {saDiff, iaDiff, fzDiff} = this.getFrictionDiff(sa, ia, fz.z);
    const dFt_dOmega = saDiff.mmul(dSa_dOmega); // (3x1)*(1x1) = (3x1)
    const dFt_dP = saDiff.mmul(dSa_dP); // (3x1)*(1x3) = (3x3)
    const dFt_dQ = saDiff.mmul(dSa_dQ); // (3x1)*(1x4) = (3x4)
    const dFt_df = fzDiff.mmul(dfz_df); // (3x1)*(1x3) = (3x3)

    // 摩擦力のx成分のみ抽出(駆動力やブレーキ力のトルクはタイヤだけでは釣り合わないため)
    let frictionX = frictionOrg.x;
    const dFtx_dOmega = dFt_dOmega.getRowVector(0); // (1x1)
    const dFtx_dP = dFt_dP.getRowVector(0); // (1x3)
    const dFtx_dQ = dFt_dQ.getRowVector(0); // (1x4)
    const dFtx_df = dFt_df.getRowVector(0); // (1x3)

    // 車両空間へ回転させる
    const frictionRotMat = getFrictionRotation(k);
    const dFtR_dQ1 = frictionRotationDiff(dk_dQ, frictionOrg); // (3x4);
    const dFtR_dQ2 = frictionRotMat.mmul(dFt_dQ); // (3x4)
    const dFtR_dQ = dFtR_dQ1.clone().add(dFtR_dQ2);
    const dFtR_dP = frictionRotMat.mmul(dFt_dP); // (3x3)
    const dFtR_dOmega = frictionRotMat.mmul(dFt_dOmega); // (3x1)
    const dFtR_df = frictionRotMat.mmul(dFt_df); // (3x1)

    const friction = getVector3(frictionRotMat.mmul(getVVector(frictionOrg)));

    // FxとFtによる反力
    if (this.disableTireFriction) {
      frictionX = 0;
      dFtx_dOmega.mul(0);
      dFtx_dP.mul(0);
      dFtx_dQ.mul(0);
      dFtx_df.mul(0);

      friction.set(0, 0, 0);
      dFtR_dP.mul(0);
      dFtR_dQ.mul(0);
      dFtR_dOmega.mul(0);
      dFtR_df.mul(0);
    }

    // const friction2 = frictionRotMat.mmul(getVVector(frictionOrg));
    return {
      sa,
      friction,
      frictionX,
      ma,
      fz,
      vO,
      omega,
      omegaSkew,
      k,
      A,
      G,
      axis,
      dk_dQ,
      dFtR_dP,
      dFtR_dQ,
      dFtR_dOmega,
      dFtR_df,
      dFtx_dOmega,
      dFtx_dP,
      dFtx_dQ,
      dFtx_df
    };
  }

  getDriveMoment(params?: {
    frictionX: number;
    dFtx_dOmega: Matrix;
    dFtx_dP: Matrix;
    dFtx_dQ: Matrix;
    dFtx_df: Matrix;
    axis: Vector3;
    A: Matrix;
    G: Matrix;
  }) {
    const {tireRadius, torqueRatio, error} = this;
    const {A, G, frictionX, dFtx_dOmega, dFtx_df, dFtx_dP, dFtx_dQ, axis} =
      params ?? this.getTireVectors();

    // 駆動力による車軸周りのモーメント(車軸周りのモーメントはこの項がないと釣り合わない)
    const lmX = -tireRadius * (frictionX + torqueRatio * error.value);
    const mX = axis.clone().multiplyScalar(lmX);

    const dMx_dFtx = getVVector(axis).mul(-tireRadius); // (3x1)
    const dMX_de = dMx_dFtx.clone().mul(torqueRatio); // (3x1)
    const dMX_dOmega = dMx_dFtx.mmul(dFtx_dOmega); // (3x1)*(1x1) = (3x1)

    const dMX_df = dMx_dFtx.mmul(dFtx_df); // (3x1)*(1x3) = (3x3)
    const dMX_dP = dMx_dFtx.mmul(dFtx_dP); // (3x1)*(1x3) = (3x3)
    const dMX_dQ1 = dMx_dFtx.mmul(dFtx_dQ); // (3x1)*(1x4) = (3x4)
    const dMX_dQ2 = A.mmul(this.localAxisSkew).mmul(G).mul(lmX); // (3x4)
    const dMX_dQ = dMX_dQ1.clone().add(dMX_dQ2);
    return {
      mX,
      dMX_dOmega,
      dMX_de,
      dMX_df: this.pfCoefs.map((co) => dMX_df.clone().mul(co)),
      dMX_dP,
      dMX_dQ,
      pfsCols: this.pfs.map((pf) => pf.col),
      targetComponentCol: this.component.col,
      targetErrorCol: this.error.col
    };
  }

  applytoElement() {}

  setJacobianAndConstraintsInequal() {}

  checkInequalityConstraint(): [boolean, any] {
    return [false, null];
  }
}

export function isTireBalance(c: Constraint): c is TireBalance {
  return c.className === TireBalance.className;
}
