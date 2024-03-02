/* eslint-disable max-classes-per-file */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable no-lone-blocks */
import {Matrix, SingularValueDecomposition, inverse} from 'ml-matrix';
import {Control} from '@gd/controls/IControls';
import {
  IElement,
  IAssembly,
  isSimplifiedElement,
  isBodyOfFrame
} from '@gd/IElements';
import {JointAsVector3} from '@gd/IElements/IAssembly';
import {isAArm} from '@gd/IElements/IAArm';
import {isBar} from '@gd/IElements/IBar';
import {IBody} from '@gd/IElements/IBody';
import {isTire} from '@gd/IElements/ITire';
import {isSpringDumper} from '@gd/IElements/ISpringDumper';
import {isLinearBushing} from '@gd/IElements/ILinearBushing';
import {isTorsionSpring} from '@gd/IElements/ITorsionSpring';
import {Vector3, Quaternion} from 'three';
import {
  isPointToPlaneControl,
  PointToPlaneControl
} from '@gd/controls/PointToPlaneControl';
import {hasNearestNeighborToPlane} from '@gd/SpecialPoints';
import {sleep} from '@utils/helpers';
import {ISteadySkidpadParams} from '@gd/analysis/ITest';
import {ISnapshot} from '@gd/analysis/ISnapshot';
import {Twin, Triple, OneOrTwo} from '@utils/atLeast';
import {getTire} from '@tire/listTireData';
import {Constraint, ConstraintsOptions} from '@gd/kinematics/IConstraint';
import {ConstantVector3} from '@computationGraph/ConstantVector3';
import {ConstantScalar} from '@computationGraph/ConstantScalar';
import {
  getJointDictionary,
  canSimplifyAArm,
  canSimplifyTire,
  getJointPartner,
  isFixedElement,
  getJointsToOtherComponents,
  getNamedVector3FromJoint,
  getSimplifiedTireConstrainsParams,
  elementIsComponent,
  getTireFriction,
  getPointComponent,
  getPFComponent
} from './KinematicFunctions';
import {
  Restorer,
  TireRestorer,
  AArmRestorer,
  BarRestorer,
  LinearBushingRestorer,
  TorsionSpringRestorer,
  RelativeConstraintRestorer
} from './Restorer';
import {
  Sphere,
  Hinge,
  BarAndSpheres,
  LinearBushingSingleEnd,
  PointToPlane
} from './KinematicConstraints';
import {
  BarBalance,
  isBarBalance,
  AArmBalance,
  TireBalance,
  TorsionSpringBalance,
  LinearBushingBalance,
  isBalance,
  isFDComponentBalance,
  FDComponentBalance
} from './SkidpadConstraints';
import {
  IVariable,
  IComponent,
  FullDegreesComponent,
  isFullDegreesComponent,
  PointComponent,
  PointForce,
  GeneralVariable,
  isPointForce
} from './KinematicComponents';
import {ISolver, IForceSolver} from './ISolver';

interface ISolverState {
  // 表示する際の基準となる力の大きさ
  stdForce: number;

  v: number; // m/s

  omega: number;

  r: number;

  rMin: number;

  lapTime: number;

  scale: number;

  forceScale: number;
}

export class SkidpadSolver implements IForceSolver {
  static className = 'SkidpadSolver' as const;

  readonly className = SkidpadSolver.className;

  isForceSolver = true as const;

  get stdForce() {
    return this.state.stdForce;
  }

  set stdForce(value: number) {
    this.state.stdForce = value;
  }

  assembly: IAssembly;

  controls: {[index: string]: Control[]};

  components: IVariable[][];

  pointComponents: {[index: string]: PointComponent};

  componentsFromNodeID: {[index: string]: IComponent};

  restorers: Restorer[];

  running: boolean = false;

  get firstSolved() {
    return !!this.firstSnapshot;
  }

  firstSnapshot: ISnapshot | undefined;

  config: ISteadySkidpadParams;

  state: ISolverState;

  constructor(
    assembly: IAssembly,
    config: ISteadySkidpadParams,
    controlsAll: {[index: string]: Control[]},
    scale: number,
    forceScale: number,
    solve: boolean
  ) {
    this.config = config;
    this.state = {
      stdForce: 1000,
      v: config.velocity.value,
      omega: 0,
      r: Number.MAX_SAFE_INTEGER,
      rMin: Number.MAX_SAFE_INTEGER,
      lapTime: Number.MAX_SAFE_INTEGER,
      scale,
      forceScale
    };
    this.assembly = assembly;
    this.controls = Object.keys(controlsAll).reduce((dict, key) => {
      const cls = controlsAll[key].filter(
        (c) => !c.disabledWhileDynamicSolverIsActive
      );
      if (cls.length > 0) {
        dict[key] = cls;
      }
      return dict;
    }, {} as {[index: string]: Control[]});
    this.components = [];
    this.pointComponents = {};
    this.componentsFromNodeID = {};
    this.restorers = [];
    this.reConstruct();

    if (solve) this.firstSolve();
  }

  reConstruct() {
    this.state = {
      stdForce: 1000,
      v: this.config.velocity.value,
      omega: 0,
      r: Number.MAX_SAFE_INTEGER,
      rMin: Number.MAX_SAFE_INTEGER,
      lapTime: Number.MAX_SAFE_INTEGER,
      scale: this.state.scale,
      forceScale: this.state.forceScale
    };
    this.firstSnapshot = undefined;
    this.components = [];
    this.pointComponents = {};
    this.componentsFromNodeID = {};
    this.restorers = [];
    this.assembly.arrange();

    const vO = () =>
      new Vector3(this.state.v, 0, 0).multiplyScalar(scale * 1000);
    const {assembly, controls, config} = this;
    const {scale, forceScale} = this.state;
    const {children} = assembly;

    const joints = assembly.getJointsAsVector3();
    const jointDict = getJointDictionary(children, joints);
    const constraints: Constraint[] = [];
    const components: IVariable[] = [];
    const jointsDone = new Set<JointAsVector3>();
    const pointForceComponents: {[index: string]: PointForce} = {};
    const tempComponents: {[index: string]: FullDegreesComponent} = {};
    const tempElements: {[index: string]: IElement} = {};
    let specialControls: {[index: string]: Control[]} = {};
    const tireBalances: {[index: string]: TireBalance[]} = {};

    const omega = new GeneralVariable('omega', 1);
    const error = new GeneralVariable('longitudinalForceError', 1);
    components.push(omega);
    // omega.value = 0.2;
    components.push(error);

    // ステップ1: ChildrenをComponentに変換する
    {
      children.forEach((element) => {
        // 拘束コンポーネントは除外する
        if (isSimplifiedElement(element)) return;
        /* 固定コンポーネントはソルバから除外していたが、
         除外しないで、あとから判定させる。
        if (isFixedElement(element)) return;
        */
        tempComponents[element.nodeID] = new FullDegreesComponent(
          element,
          scale
        );
        tempElements[element.nodeID] = element;
      });
    }
    // ステップ2: 3点以上の拘束式で拘束されているElementを統合し、相対固定拘束を作成
    // また、相対固定拘束であるというフラグを立てる
    // 計算された相対固定拘束のデルタだけ、ComponentのlocalPointsを移動する
    {
      const needToUpdatePoints = new Map<
        FullDegreesComponent,
        [Vector3, Quaternion]
      >();
      children.forEach((element) => {
        // 関連するジョイントを得る(すでに検討済みであれば破棄)
        const [partnerIDs, jDict] = getJointsToOtherComponents(
          jointDict[element.nodeID].filter((joint) => !jointsDone.has(joint)),
          element.nodeID
        );
        // 最も拘束式の多いもの(=先頭キーの大きさが3を超えていれば)
        if (partnerIDs.length) {
          const partnerID = partnerIDs[0];
          const joints = jDict[partnerID];
          if (joints.length >= 3) {
            // この2つのコンポーネントは相対固定拘束
            joints.forEach((joint) => jointsDone.add(joint));
            const component = tempComponents[element.nodeID];
            const otherComponent = tempComponents[partnerID];
            const otherElement = tempElements[partnerID];
            // 相対固定拘束を計算
            const restorer = new RelativeConstraintRestorer(
              element,
              otherElement
            );
            this.restorers.push(restorer);
            component.parent = otherComponent;
            component.isRelativeFixed = true;
            needToUpdatePoints.set(component, [
              restorer.deltaPosition,
              restorer.deltaQuaternion
            ]);
          }
        }
      });
    }
    // ステップ3: 平面拘束など、一つのコンポーネントに対する拘束式をピックアップする
    // また、AllTiresGroundedのタイヤへの拘束を与える。
    {
      // 平面拘束をピックアップ
      specialControls = Object.keys(controls).reduce((prev, current) => {
        const temp = controls[current];
        temp.forEach((control) => {
          if (isPointToPlaneControl(control)) {
            if (!prev[current]) prev[current] = [];
            prev[current].push(control);
          }
        });
        return prev;
      }, {} as {[index: string]: Control[]});
      // assemblyModeはAllTiresGrounded
      const tires = children.filter((e) => isTire(e));
      const ground = new PointToPlaneControl({
        type: 'notAssigned',
        targetElements: tires.map((t) => t.nodeID),
        inputButton: '',
        pointIDs: tires.reduce((prev, current) => {
          prev[current.nodeID] = ['nearestNeighbor'];
          return prev;
        }, {} as {[index: string]: string[]}),
        origin: new Vector3(),
        normal: new Vector3(0, 0, 1)
      });
      tires.forEach((t) => {
        if (!specialControls[t.nodeID]) specialControls[t.nodeID] = [];
        specialControls[t.nodeID].push(ground);
      });
    }
    // ステップ4: コンポーネント化しないElementを幾何拘束へ変換
    {
      const {pointComponents} = this;
      children.forEach((element) => {
        // AArmが単独で使われている場合は、BarAndSpheres2つに変更する。
        if (isAArm(element) && canSimplifyAArm(element, jointDict)) {
          const pfs: PointForce[] = [];
          const pNodeIDs: string[] = [];
          const joints = element.fixedPoints.map((p) => {
            const joint = jointDict[p.nodeID][0];
            const pf = getPFComponent(
              pointForceComponents,
              components,
              joint,
              forceScale
            );
            pfs.push(pf);
            const [pfv] = getNamedVector3FromJoint(joint, element.nodeID);
            pNodeIDs.push(pfv.nodeID);
            jointsDone.add(joint);
            return joint;
          });
          const jointu = jointDict[element.points[0].nodeID][0];
          // 力コンポーネント
          const pf = getPFComponent(
            pointForceComponents,
            components,
            jointu,
            forceScale
          );
          pfs.push(pf);
          const [pfv] = getNamedVector3FromJoint(jointu, element.nodeID);
          pNodeIDs.push(pfv.nodeID);
          jointsDone.add(jointu);
          const ptsBody = joints.map((joint, i) =>
            getJointPartner(joint, element.fixedPoints[i].nodeID)
          );
          const pUpright = getJointPartner(jointu, element.points[0].nodeID);
          const body = ptsBody[0].parent as IElement;
          const upright = pUpright.parent as IElement;
          this.restorers.push(
            new AArmRestorer(element, [ptsBody[0], ptsBody[1]], pUpright)
          );
          // AArmのすべての点が同じコンポーネントに接続されている場合エラー
          if (
            body.nodeID === upright.nodeID ||
            (isFixedElement(body) && isFixedElement(upright))
          ) {
            throw new Error('3点が同じコンポーネントに接続されている');
          }
          ptsBody.forEach((pBody, i) => {
            const constraint = new BarAndSpheres(
              `bar object of aarm ${element.name.value}`,
              tempComponents[body.nodeID],
              tempComponents[upright.nodeID],
              element.points[0].value
                .sub(element.fixedPoints[i].value)
                .length(),
              [],
              pBody.value,
              pUpright.value,
              false
            );
            constraints.push(constraint);
          });
          // AArmBalance
          constraints.push(
            new AArmBalance({
              name: `AArmBalance of${element.name.value}`,
              components: [
                tempComponents[body.nodeID],
                tempComponents[body.nodeID],
                tempComponents[upright.nodeID]
              ],
              points: [ptsBody[0].value, ptsBody[1].value, pUpright.value],
              mass: element.mass.value,
              cog: element.centerOfGravity.value,
              pfs: pfs as Triple<PointForce>,
              pfsPointNodeIDs: pNodeIDs,
              vO,
              omega,
              element
            })
          );
          return;
        }
        // BarはComponent扱いしない
        if (isBar(element) || isSpringDumper(element)) {
          const pfs: PointForce[] = [];
          const jointf = jointDict[element.fixedPoint.nodeID][0];
          const jointp = jointDict[element.point.nodeID][0];
          const pNodeIDs: string[] = [];
          const pff = getPFComponent(
            pointForceComponents,
            components,
            jointf,
            forceScale
          );
          const [pf] = getNamedVector3FromJoint(jointf, element.nodeID);
          pNodeIDs.push(pf.nodeID);
          pfs.push(pff);
          const pfp = getPFComponent(
            pointForceComponents,
            components,
            jointp,
            forceScale
          );
          const [pp] = getNamedVector3FromJoint(jointp, element.nodeID);
          pNodeIDs.push(pp.nodeID);
          pfs.push(pfp);
          jointsDone.add(jointf);
          jointsDone.add(jointp);
          const points = [
            getJointPartner(jointf, element.fixedPoint.nodeID),
            getJointPartner(jointp, element.point.nodeID)
          ];
          const elements = points.map((p) => p.parent as IElement);
          this.restorers.push(new BarRestorer(element, points[0], points[1]));
          // あまりないと思うが、Barのすべての点が同じコンポーネントに接続されている場合無視する
          if (
            elements[0].nodeID === elements[1].nodeID ||
            (isFixedElement(elements[0]) && isFixedElement(elements[1]))
          ) {
            return;
          }
          // シンプル化されていない場合、コンポーネントを得る
          let lhs: IComponent = tempComponents[elements[0].nodeID];
          let rhs: IComponent = tempComponents[elements[1].nodeID];
          if (!lhs) {
            lhs = getPointComponent(
              pointComponents,
              components,
              points[0],
              element.fixedPoint,
              scale
            );
          }
          if (!rhs) {
            rhs = getPointComponent(
              pointComponents,
              components,
              points[1],
              element.point,
              scale
            );
          }
          const controledBy =
            controls[element.nodeID]?.map((control) => control.nodeID) ?? [];
          const constraint = new BarAndSpheres(
            `bar object of ${element.name.value}`,
            lhs,
            rhs,
            element.length,
            controledBy,
            isFullDegreesComponent(lhs) ? points[0].value : undefined,
            isFullDegreesComponent(rhs) ? points[1].value : undefined,
            isSpringDumper(element),
            isSpringDumper(element) ? element.dlMin.value : undefined,
            isSpringDumper(element) ? element.dlMax.value : undefined,
            element.nodeID
          );
          constraints.push(constraint);

          // BarBalance
          const balance = new BarBalance({
            name: `BarBalance of${element.name.value}`,
            element,
            components: [lhs, rhs],
            points: [
              isFullDegreesComponent(lhs) ? points[0].value : new Vector3(),
              isFullDegreesComponent(rhs) ? points[1].value : new Vector3()
            ],
            mass: element.mass.value,
            cog: 0.5, // 要修正
            pfs: pfs as Twin<PointForce>,
            vO,
            omega,
            pfsPointNodeIDs: pNodeIDs,
            isSpring: isSpringDumper(element) && controledBy.length === 0,
            k: () => (isSpringDumper(element) ? element.k.value : 1) // N/mm : 150lbs/in
          });
          constraints.push(balance);
          return;
        }
        // Tireはコンポーネント扱いしない
        if (isTire(element)) {
          if (canSimplifyTire(element, jointDict)) {
            const jointl = jointDict[element.outerBearing.nodeID][0];
            const jointr = jointDict[element.innerBearing.nodeID][0];
            jointsDone.add(jointl);
            jointsDone.add(jointr);
            const points = [
              getJointPartner(jointl, element.outerBearing.nodeID),
              getJointPartner(jointr, element.innerBearing.nodeID)
            ];
            this.restorers.push(
              new TireRestorer(element, points[0], points[1])
            );
            // TireBalance
            const torqueRatioSum = Object.keys(config.tireTorqueRatio).reduce(
              // eslint-disable-next-line no-return-assign
              (prev, id) => (prev += Number(config.tireTorqueRatio[id])),
              0
            );
            const {
              pComponent: component,
              groundLocalVec,
              pComponentNodeID: componentID
            } = getSimplifiedTireConstrainsParams(
              element,
              jointDict,
              tempComponents,
              'nearestNeighbor'
            );
            const normal = new ConstantVector3(new Vector3(0, 0, 1));
            const tire = getTire(config.tireData[element.nodeID] ?? '');

            const tireBalance = new TireBalance({
              name: `TireBalance of${element.name.value}`,
              component,
              element,
              tireRadius: element.radius,
              points: [points[0].value, points[1].value],
              mass: element.mass.value,
              cog: 0.5, // 要修正
              torqueRatio:
                config.tireTorqueRatio[element.nodeID] / torqueRatioSum,
              getFriction: (sa, ia, fz) => {
                const sl = new ConstantScalar(0);
                // 要修正
                const {friction} = getTireFriction(tire, sa, sl, ia, fz, () => {
                  return tireBalance.disableTireFriction;
                });
                return friction;
              },
              getGround: (q) => groundLocalVec(normal, new ConstantScalar(0), q)
            });

            if (!tireBalances[componentID]) tireBalances[componentID] = [];
            tireBalances[componentID].push(tireBalance);
          } else {
            throw new Error('Tireは同じコンポーネントに接続される必要がある');
            // 2023.06.17 二つ以上のコンポーネントにまたがるタイヤは、
            // 一つのコンポーネント扱いとするように変更(接地点の計算が面倒極まるため)
            // 計算負荷は無視することにする。
            // 将来的には方法を考えるかも
            // 以下はかなり特殊な場合（BRGの剛性を再現しているとか）
            /* const constraint = new BarAndSpheres(
            `bar object of tire ${element.name.value}`,
            tempComponents[elements[0].nodeID],
            tempComponents[elements[1].nodeID],
            element.bearingDistance,
            points[0].value,
            points[1].value,
            false
          );
          constraints.push(constraint); */
          }
        }
        // LinearBushingはComponent扱いしない
        if (isLinearBushing(element)) {
          const pfsFrame: PointForce[] = [];
          const pfsRodEnd: PointForce[] = [];
          const pfsFramePointNodeIDs: string[] = [];
          const pfsRodEndPointNodeIDs: string[] = [];
          const jointf = element.fixedPoints.map(
            (fp) => jointDict[fp.nodeID][0]
          );
          const fixedPoints = jointf.map((joint, i) =>
            getJointPartner(joint, element.fixedPoints[i].nodeID)
          );
          jointf.forEach((joint) => {
            const pf = getPFComponent(
              pointForceComponents,
              components,
              joint,
              forceScale
            );
            pfsFrame.push(pf);
            const [pfc] = getNamedVector3FromJoint(joint, element.nodeID);
            pfsFramePointNodeIDs.push(pfc.nodeID);
            jointsDone.add(joint);
          });
          const node0: (Vector3 | undefined)[] = [];
          const component0: IComponent[] = [];
          const rodEndComponents: IComponent[] = [];
          const rodEndPoints: Vector3[] = [];
          const frameComponent =
            tempComponents[fixedPoints[0].parent?.nodeID ?? ''];
          if (!frameComponent) throw new Error('frameComponentが見つからない');
          element.points.forEach((point, i) => {
            const jointRodEnd = jointDict[point.nodeID][0];
            const pf = getPFComponent(
              pointForceComponents,
              components,
              jointRodEnd,
              forceScale
            );
            const [pfc] = getNamedVector3FromJoint(jointRodEnd, element.nodeID);
            pfsRodEnd.push(pf);
            pfsRodEndPointNodeIDs.push(pfc.nodeID);
            jointsDone.add(jointRodEnd);
            const points = [
              ...fixedPoints,
              getJointPartner(jointRodEnd, point.nodeID)
            ];
            const elements = points.map((p) => p.parent as IElement);
            let rhs: IComponent = tempComponents[elements[2].nodeID];
            if (!rhs) {
              rhs = getPointComponent(
                pointComponents,
                components,
                points[2],
                point,
                scale
              );
            }
            // 最初のみリストアに登録
            if (i === 0) {
              this.restorers.push(
                new LinearBushingRestorer(
                  element,
                  [points[0], points[1]],
                  points[2]
                )
              );
            }

            // あまりないと思うが、LinearBushingのすべての点が同じコンポーネントに接続されている場合無視する
            if (
              elements[0].nodeID === elements[2].nodeID ||
              (isFixedElement(elements[0]) && isFixedElement(elements[2]))
            ) {
              throw new Error(
                'LinearBushingのRodEndはFrameと別のコンポーネントに接続されている必要がある'
              );
            }
            rodEndComponents.push(rhs);
            rodEndPoints.push(
              isFullDegreesComponent(rhs) ? points[2].value : new Vector3()
            );

            const controledBy =
              controls[element.nodeID]?.map((control) => control.nodeID) ?? [];
            // コントロールされていない場合
            if (!controledBy.length) {
              if (i === 0) {
                node0.push(
                  isFullDegreesComponent(rhs) ? points[2].value : undefined
                );
                component0.push(rhs);
              } else {
                const v0 = node0[0];
                const lhs = component0[0];
                const l = element.toPoints[i].value - element.toPoints[0].value;
                const constraint = new BarAndSpheres(
                  `bar object of ${element.name.value} ${i}`,
                  lhs,
                  rhs,
                  l,
                  [],
                  v0,
                  isFullDegreesComponent(rhs) ? points[2].value : undefined
                );
                constraints.push(constraint);
              }
            }
            const constraint = new LinearBushingSingleEnd(
              `Linear bushing object of ${element.name.value}`,
              frameComponent,
              rhs,
              [points[0].value, points[1].value],
              element.toPoints[i].value,
              controledBy,
              isFullDegreesComponent(rhs) ? points[2].value : undefined,
              element.dlMin.value,
              element.dlMax.value,
              element.nodeID
            );
            constraints.push(constraint);
          });
          // LinearBushingBalance
          constraints.push(
            new LinearBushingBalance({
              name: `LinearBushingBalance of${element.name.value}`,
              element,
              frameComponent,
              framePoints: [fixedPoints[0].value, fixedPoints[1].value],
              rodEndComponents: rodEndComponents as OneOrTwo<IComponent>,
              rodEndPoints: rodEndPoints as OneOrTwo<Vector3>,
              cog: fixedPoints[0].value
                .clone()
                .add(fixedPoints[1].value)
                .multiplyScalar(0.5), // 要修正
              pfsFrame: pfsFrame as Twin<PointForce>,
              pfsRodEnd: pfsRodEnd as OneOrTwo<PointForce>,
              pfsFramePointNodeIDs,
              pfsRodEndPointNodeIDs,
              mass: element.mass.value,
              getVO: vO,
              omega
            })
          );
        }
        // TorsionSpringはComponent扱いしない
        if (isTorsionSpring(element)) {
          const pfsFrame: PointForce[] = [];
          const pfsEffort: PointForce[] = [];
          const pfsFramePointNodeIDs: string[] = [];
          const pfsEffortPointNodeIDs: string[] = [];
          const jointf = element.fixedPoints.map(
            (fp) => jointDict[fp.nodeID][0]
          );
          const fixedPoints = jointf.map((joint, i) =>
            getJointPartner(joint, element.fixedPoints[i].nodeID)
          );
          jointf.forEach((joint) => {
            const pf = getPFComponent(
              pointForceComponents,
              components,
              joint,
              forceScale
            );
            pfsFrame.push(pf);
            const [pfc] = getNamedVector3FromJoint(joint, element.nodeID);
            pfsFramePointNodeIDs.push(pfc.nodeID);
            jointsDone.add(joint);
          });
          const frameComponent =
            tempComponents[fixedPoints[0].parent?.nodeID ?? ''];
          if (!frameComponent) throw new Error('frameComponentが見つからない');
          const effortPoints: typeof fixedPoints = [];
          const effortComponents: IComponent[] = [];
          element.effortPoints.forEach((ep) => {
            const jointEffort = jointDict[ep.nodeID][0];
            const pf = getPFComponent(
              pointForceComponents,
              components,
              jointEffort,
              forceScale
            );
            const [pfc] = getNamedVector3FromJoint(jointEffort, element.nodeID);
            pfsEffort.push(pf);
            pfsEffortPointNodeIDs.push(pfc.nodeID);
            jointsDone.add(jointEffort);

            const epp = getJointPartner(jointEffort, ep.nodeID);
            effortPoints.push(epp);
            const points = [...fixedPoints, epp];
            const elements = points.map((p) => p.parent as IElement);
            let rhs: IComponent = tempComponents[elements[2].nodeID];
            if (!rhs) {
              rhs = getPointComponent(
                pointComponents,
                components,
                points[2],
                ep,
                scale
              );
            }
            effortComponents.push(rhs);
            // あまりないと思うが、すべての点が同じコンポーネントに接続されている場合無視する
            if (
              elements[0].nodeID === elements[2].nodeID ||
              (isFixedElement(elements[0]) && isFixedElement(elements[2]))
            ) {
              throw new Error(
                'TorsionSpringのロッドエンド2番はフレームと異なるコンポーネントに接続する必要あり'
              );
            }
            element.fixedPoints.forEach((fp, i) => {
              const lhs: IComponent = tempComponents[elements[i].nodeID];
              const constraint = new BarAndSpheres(
                `bar object of aarm ${element.name.value}`,
                lhs,
                rhs,
                fp.value.sub(ep.value).length(),
                [],
                fixedPoints[i].value,
                isFullDegreesComponent(rhs) ? points[2].value : undefined,
                false
              );
              constraints.push(constraint);
            });
          });
          const constraint = new BarAndSpheres(
            `spring bar object of aarm ${element.name.value}`,
            effortComponents[0],
            effortComponents[1],
            element.effortPoints[0].value
              .sub(element.effortPoints[1].value)
              .length(),
            [],
            isFullDegreesComponent(effortComponents[0])
              ? effortPoints[0].value
              : undefined,
            isFullDegreesComponent(effortComponents[1])
              ? effortPoints[1].value
              : undefined,
            true
          );
          constraints.push(constraint);
          const balance = new TorsionSpringBalance({
            name: `TorsionSpringBalance of${element.name.value}`,
            element,
            frameComponent,
            framePoints: [fixedPoints[0].value, fixedPoints[1].value],
            effortComponents: effortComponents as Twin<IComponent>,
            effortPoints: effortPoints.map((p) => p.value) as Twin<Vector3>,
            cog: fixedPoints[0].value
              .clone()
              .add(fixedPoints[1].value)
              .multiplyScalar(0.5), // 要修正
            pfsFrame: pfsFrame as Twin<PointForce>,
            pfsEffort: pfsEffort as Twin<PointForce>,
            pfsFramePointNodeIDs,
            pfsEffortPointNodeIDs,
            mass: element.mass.value,
            getVO: vO,
            omega,
            k: () => element.k.value // N・m/deg
          });
          constraints.push(balance);

          this.restorers.push(
            new TorsionSpringRestorer(
              element,
              [fixedPoints[0], fixedPoints[1]],
              [effortPoints[0], effortPoints[1]]
            )
          );
        }
      });
    }
    // ステップ5: この時点でElement間の拘束点は2点以下なので、Sphere拘束か
    // Hinge拘束か、BarAndSpher拘束を実施する。
    // この時点でコンポーネント間の拘束はただ1つの拘束式になっている。
    // また特殊な拘束に対して処置する。
    {
      this.componentsFromNodeID = {};
      children.forEach((element) => {
        const component = tempComponents[element.nodeID];
        // 特殊な拘束に対する拘束式を作成(例えば平面へ点を拘束するなど)
        if (specialControls[element.nodeID]) {
          specialControls[element.nodeID].forEach((control) => {
            if (isPointToPlaneControl(control)) {
              // 点を平面に拘束する
              if (isTire(element) && canSimplifyTire(element, jointDict)) {
                control.pointIDs[element.nodeID].forEach((pID) => {
                  const {pComponent, groundLocalVec} =
                    getSimplifiedTireConstrainsParams(
                      element,
                      jointDict,
                      tempComponents,
                      pID
                    );
                  const name =
                    pID === 'nearestNeighbor'
                      ? `Two-dimentional Constraint of nearest neighbor of ${element.name.value}`
                      : `Two-dimentional Constraint of ${element.name.value}`;
                  const constraint = new PointToPlane(
                    name,
                    pComponent,
                    groundLocalVec,
                    control.origin.value,
                    control.normal.value,
                    element.nodeID,
                    [control.nodeID],
                    control.min.value,
                    control.max.value
                  );
                  constraints.push(constraint);
                });
                return;
              }

              if (!elementIsComponent(element, jointDict)) return;
              // 相対固定拘束の場合は、親のみを追加
              if (component.isRelativeFixed) return;

              control.pointIDs[element.nodeID].forEach((pID) => {
                if (
                  pID === 'nearestNeighbor' &&
                  hasNearestNeighborToPlane(element)
                ) {
                  const constraint = new PointToPlane(
                    `Two-dimentional Constraint of nearest neighbor of ${element.name.value}`,
                    component,
                    (normal, distance) =>
                      new ConstantVector3(
                        element.getNearestNeighborToPlane(
                          normal.vector3Value,
                          distance.scalarValue / component.scale
                        )
                      ),
                    control.origin.value,
                    control.normal.value,
                    element.nodeID,
                    [control.nodeID],
                    control.min.value,
                    control.max.value
                  );
                  constraints.push(constraint);
                } else {
                  const points = element.getMeasurablePoints();
                  const point = points.find((point) => point.nodeID === pID);
                  if (point) {
                    const p = point.value.multiplyScalar(component.scale);
                    const constraint = new PointToPlane(
                      `Two-dimentional Constraint of ${point.name} of ${element.name.value}`,
                      component,
                      () => new ConstantVector3(p),
                      control.origin.value,
                      control.normal.value,
                      element.nodeID,
                      [control.nodeID],
                      control.min.value,
                      control.max.value
                    );
                    constraints.push(constraint);
                  }
                }
              });
            }
          });
        }
        if (!elementIsComponent(element, jointDict)) return;
        // 相対固定拘束の場合は、親のみを追加
        if (component.isRelativeFixed) {
          return;
        }
        // solverにコンポーネントを追加する
        components.push(component);
        this.componentsFromNodeID[element.nodeID] = component;
        // 関連するジョイントを得る(すでに検討済みであれば破棄)
        const [partnerIDs, jDict] = getJointsToOtherComponents(
          jointDict[element.nodeID].filter((joint) => !jointsDone.has(joint)),
          element.nodeID
        );
        // 拘束の多い順に拘束式を作成
        const pfs: PointForce[] = [];
        const joints = jointDict[element.nodeID];
        const points: Vector3[] = [];
        const pNodeIDs: string[] = [];
        joints.forEach((joint) => {
          const pID =
            getJointPartner(joint, element.nodeID).parent?.nodeID ?? '';
          const pElement = children.find((c) => c.nodeID === pID);
          if (!pElement || isTire(pElement)) return;
          const pf = getPFComponent(
            pointForceComponents,
            components,
            joint,
            forceScale
          );
          pfs.push(pf);
          const [pThis] = getNamedVector3FromJoint(joint, element.nodeID);
          points.push(pThis.value);
          pNodeIDs.push(pThis.nodeID);
        });
        partnerIDs.forEach((partnerID) => {
          const otherComponent = tempComponents[partnerID];
          const otherElement = tempElements[partnerID];
          const joints = jDict[partnerID];
          const vLhs: Vector3[] = [];
          const vRhs: Vector3[] = [];
          let constraint: Constraint;
          joints.forEach((joint) => {
            jointsDone.add(joint);
            const [pThis, pPartner] = getNamedVector3FromJoint(
              joint,
              element.nodeID,
              partnerID
            );
            vLhs.push(pThis.value);
            vRhs.push(pPartner.value);
          });
          // コンポーネント間の拘束の数は2以下
          if (joints.length === 2) {
            constraint = new Hinge(
              `Hinge Constrains to ${element.name.value} and ${otherElement.name.value}`,
              component,
              otherComponent,
              [vLhs[0], vLhs[1]],
              [vRhs[0], vRhs[1]]
            );
          } else {
            // 1点拘束
            constraint = new Sphere(
              `Sphere Constraint to ${element.name.value} and ${otherElement.name.value}`,
              component,
              otherComponent,
              vLhs[0],
              vRhs[0]
            );
          }
          constraints.push(constraint);
        });
        // if (!isBody(element) || isBodyOfFrame(element)) return;
        if (
          tireBalances[element.nodeID] &&
          tireBalances[element.nodeID].length > 1
        ) {
          throw new Error(
            'Bodyに接続されるtireBalanceの数は1つである必要がある'
          );
        }

        // FDComponentBalance
        constraints.push(
          new FDComponentBalance({
            name: `FDComponentBalance of${element.name.value}`,
            element,
            component,
            connectedTireBalance: tireBalances[element.nodeID]
              ? tireBalances[element.nodeID][0]
              : undefined,
            mass: element.mass.value,
            cog: element.centerOfGravity.value,
            points,
            pointForceComponents: pfs,
            pfsPointNodeIDs: pNodeIDs,
            vO,
            omega,
            error
          })
        );
      });
      // フレームをピン止めする
      const frame = children.find((e) => e.meta?.isBodyOfFrame) as IBody;
      const p = frame.centerOfGravity.value.multiplyScalar(scale);
      const component = tempComponents[frame.nodeID];
      constraints.push(
        new PointToPlane(
          `Two-dimentional Constraint of ${frame.centerOfGravity.name} of ${frame.name.value}`,
          component,
          () => new ConstantVector3(p),
          new Vector3(),
          new Vector3(1, 0, 0),
          frame.nodeID,
          [],
          0,
          0
        )
      );
      constraints.push(
        new PointToPlane(
          `Two-dimentional Constraint of ${frame.centerOfGravity.name} of ${frame.name.value}`,
          component,
          () => new ConstantVector3(p),
          new Vector3(),
          new Vector3(0, 1, 0),
          frame.nodeID,
          [],
          0,
          0
        )
      );
    }
    // ステップ5: 正規化拘束式の作成
    {
      const rootComponents = [components[0]];
      this.components = rootComponents.map((root) => {
        root.unionFindTreeConstraints = [...constraints];
        components.forEach((component) => {
          const constraintToNormalize = isFullDegreesComponent(component)
            ? component.getConstraintToNormalize()
            : null;
          if (constraintToNormalize) {
            root.unionFindTreeConstraints.push(constraintToNormalize);
          }
        });
        return components;
      });
      // コンポーネントの列番号を設定
      this.components.forEach((components) => {
        components.reduce((prev, current) => {
          current.setCol(prev);
          prev += current.degreeOfFreedom;
          return prev;
        }, 0);
      });
    }
    // 上記4ステップでプリプロセッサ完了
  }

  getGroupItBelongsTo(component: IVariable): [IVariable, IVariable[]] {
    for (const components of this.components) {
      const root = components[0];
      if (root.root === component.root) return [root, components];
    }
    throw new Error('所属しているグループが見つからない');
  }

  solve(params?: {
    fixSpringDumperAtCurrentPosition?: boolean;
    constraintsOptions?: ConstraintsOptions;
    maxCnt?: number;
    postProcess?: boolean;
    logOutput?: boolean;
    isFirstSolve?: boolean;
  }): void {
    if (!this.firstSolved && !params?.isFirstSolve) this.firstSolve();
    if (this.running) return;
    this.running = true;
    try {
      const start = performance.now();
      const maxCnt = params?.maxCnt ?? 100; // 200;
      const postProcess = params?.postProcess ?? true;
      const constraintsOptions = params?.constraintsOptions ?? {};
      const logOutput = params?.logOutput ?? false;

      // Kinematicソルバを解く
      this.components.forEach((components) => {
        const root = components[0];
        const constraints = root
          .getGroupedConstraints()
          .filter((constraint) => constraint.active(constraintsOptions));
        constraints.forEach((c) => {
          if (isFDComponentBalance(c) && c.conectedTireBalance) {
            c.conectedTireBalance.disableTireFriction =
              !!constraintsOptions.disableTireFriction;
          }
        });

        const equations = constraints.reduce((prev, current) => {
          current.row = prev;
          return prev + current.constraints(constraintsOptions);
        }, 0);
        const degreeOfFreedom = components.reduce((prev, current) => {
          return prev + current.degreeOfFreedom;
        }, 0);
        // いつも同じところが更新されるので、毎回newしなくてもよい
        const phi_q = new Matrix(equations, degreeOfFreedom);
        const phi = new Array<number>(equations);

        let i = 0;
        let minNorm = Number.MAX_SAFE_INTEGER;
        let eq = false;
        while (!eq && ++i < maxCnt) {
          phi_q.mul(0); // add subをする場合があるので0リードしておく
          constraints.forEach((constraint) => {
            constraint.setJacobianAndConstraints(
              phi_q,
              phi,
              constraintsOptions
            );
          });

          const matPhi = Matrix.columnVector(phi);
          const dq = new SingularValueDecomposition(phi_q, {
            autoTranspose: true
          })
            .solve(matPhi)
            .mul(1);

          // 差分を反映
          components.forEach((component) => component.applyDq(dq));

          const norm_dq = dq.norm('frobenius');
          const norm_phi = matPhi.norm('frobenius');
          const omega = (components[0] as GeneralVariable).value;
          const maxR = 100000000000;
          this.state.r = Math.max(-maxR, Math.min(this.state.v / omega, maxR));
          this.state.omega = omega;
          this.state.lapTime = Math.abs((Math.PI * 2) / omega);
          const phiMax = Math.max(...phi);
          const phiMaxIdx = phi.indexOf(phiMax);
          const dqData = (dq as any).data.map((d: any) => d[0]);
          const dqMax = Math.max(...dqData);
          const dqMin = Math.min(...dqData);
          const dqMaxIdx = dqData.indexOf(dqMax);
          const dqMinIdx = dqData.indexOf(dqMin);
          if (i > 20 || logOutput) {
            // const row = constraintsOptions.disableForce ? 0 : 92;
            /* const row = 90;
            const iPhi_q = inverse(phi_q, true);
            const {data: iData} = iPhi_q as any;
            const id = iData[row];
            const dotOrg = phi.map((p, i) => phi[i] * id[i]);
            const large = dotOrg.map((x) => (x > 0.001 ? 1 : 0));
            const dot = dotOrg.map((x, i) => x * large[i]);

            const {data} = phi_q as any;
            const d = data.map((d: any) => d[row]); */

            console.log(`round: ${i}`);
            console.log(`phi_max   = ${phiMax.toFixed(4)}`);
            console.log(`phi_maxIdx= ${phiMaxIdx}`);
            console.log(`dq_max   = ${dqMax.toFixed(4)}`);
            console.log(`dq_min   = ${dqMin.toFixed(4)}`);
            console.log(`dq_maxIdx= ${dqMaxIdx}`);
            console.log(`dq_minIdx= ${dqMinIdx}`);
            console.log(`velocity=   ${this.state.v.toFixed(4)} m/s`);
            console.log(`radius=     ${this.state.r.toFixed(4)} m`);
            console.log(`lap time=   ${this.state.lapTime.toFixed(4)} s`);
            console.log(`norm_dq=    ${norm_dq.toFixed(4)}`);
            console.log(`norm_phi=   ${norm_phi.toFixed(4)}`);
            console.log(``);
          }
          eq = norm_dq < 1e-4 && norm_phi < 1e-4;
          // eq = norm_phi < 1e-3;
          if (constraintsOptions.disableTireFriction) {
            eq = norm_dq < 2e-1 && norm_phi < 2e-1;
          }
          if (norm_dq > minNorm * 100000 || Number.isNaN(norm_dq)) {
            console.log(`norm_dq=  ${norm_dq.toFixed(4)}`);
            console.log(`norm_phi= ${norm_phi.toFixed(4)}`);
            console.log('収束していない');
            throw new Error('ニュートンラプソン法収束エラー');
          }
          if (norm_dq < minNorm) {
            minNorm = norm_dq;
          }
        }
        if (i >= maxCnt) {
          // eslint-disable-next-line no-console
          console.log('maxCntに到達');
          throw new Error('ニュートンラプソン法収束エラー');
        }
      });

      const end = performance.now();
      if (logOutput) {
        // eslint-disable-next-line no-console
        console.log(`solver converged...\ntime = ${(end - start).toFixed(1)}`);
      }

      if (postProcess) {
        this.postProcess();
      }
    } catch (e) {
      this.running = false;
      this.components.forEach((components) => {
        components.forEach((component) => component.reset());
      });
      throw e;
    }
    this.running = false;
  }

  private firstSolve() {
    console.log('calculating initial positions...........');
    this.solve({
      constraintsOptions: {
        disableSpringElasticity: true,
        fixLinearBushing: true,
        disableTireFriction: true,
        disableForce: true
      },
      postProcess: true,
      logOutput: true,
      isFirstSolve: true
    });
    console.log('');
    console.log('calculating initial forces...........');
    this.solve({
      constraintsOptions: {
        disableSpringElasticity: true,
        fixLinearBushing: true,
        disableTireFriction: true
      },
      postProcess: true,
      isFirstSolve: true,
      logOutput: true
    });
    console.log('');
    // if (true) return;

    console.log('');
    console.log('calculating with tire frictions............');
    this.solve({
      constraintsOptions: {
        disableSpringElasticity: true,
        fixLinearBushing: true
      },
      postProcess: true,
      isFirstSolve: true,
      logOutput: true
    });

    console.log('calculating spring preloads...........');
    this.components.forEach((components) => {
      const root = components[0];
      const constraints = root.getGroupedConstraints().filter((constraint) =>
        constraint.active({
          disableTireFriction: true
        })
      );
      constraints.forEach((c) => {
        if (isBarBalance(c) && c.isSpring) c.setPreload();
      });
    });

    console.log('');
    console.log('calculating with spring force............');
    this.solve({
      constraintsOptions: {
        disableSpringElasticity: false,
        fixLinearBushing: true
      },
      postProcess: true,
      isFirstSolve: true,
      logOutput: true
    });

    let maxForce = 1000;
    this.components.forEach((components) => {
      components.forEach((component) => {
        if (isPointForce(component)) {
          const magnitude = component.force.length();
          if (magnitude > maxForce) maxForce = Number(magnitude.toFixed(0));
        }
      });
    });
    this.state.stdForce = maxForce * 2;

    if (!this.firstSolved) {
      this.firstSnapshot = this.getSnapshot();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  solveObjectiveFunction() {}

  async wait(): Promise<void> {
    // eslint-disable-next-line no-await-in-loop
    while (this.running) await sleep(10);
  }

  restoreInitialQ() {
    try {
      if (!this.firstSnapshot) {
        this.solve();
        return;
      }
      this.restoreState(this.firstSnapshot);
      this.postProcess();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }

  getSnapshot(): ISnapshot {
    return {
      dofState: this.components.reduce((prev, components, i) => {
        components.forEach((component, j) => {
          prev[`${j}@${i}`] = component.saveState();
        });
        return prev;
      }, {} as {[index: string]: number[]}),
      constraintsState: this.components.reduce((prev, components, i) => {
        components[0].getGroupedConstraints().forEach((c, j) => {
          prev[`${j}@${i}`] = c.saveState();
        });
        return prev;
      }, {} as {[index: string]: number[]}),
      solverState: {...this.state}
    };
  }

  restoreState(snapshot: ISnapshot): void {
    const {dofState, constraintsState} = snapshot;
    if (!this.firstSnapshot) this.firstSnapshot = snapshot;
    this.components.forEach((components, i) => {
      components.forEach((component, j) => {
        component.restoreState(dofState[`${j}@${i}`]);
      });
      components[0].getGroupedConstraints().forEach(
        // eslint-disable-next-line no-return-assign
        (constraint, j) =>
          constraint.restoreState(constraintsState[`${j}@${i}`])
      );
    });
    this.state = {...(snapshot.solverState as ISolverState)};
  }

  solveMaxV({
    getSnapshot
  }: {
    getSnapshot: (solver: ISolver) => Required<ISnapshot>;
  }) {
    const maxCount = this.config.maxLoopCountV.value;
    const start = performance.now();
    let count = 0;
    let deltaV = this.config.velocityStepSize.value;
    if (deltaV < 0) throw new Error('deltaV must greater than 0');
    const velocityEps = this.config.velocityEps.value;
    const laptimeEps = this.config.lapTimeEps.value;
    const ss: Required<ISnapshot>[] = [];
    let maxV = 0;
    let maxVConverged = 0;
    let minLaptimeConverged = Number.MAX_SAFE_INTEGER;
    let storedState: ISnapshot | undefined;
    let steeringPosition = 0;
    let lastSlope = Number.NaN;
    let interpolate2: Interpolate2Points | undefined;
    while (count < maxCount) {
      if (deltaV < velocityEps) {
        console.log('velocity converged!');
        break;
      }
      try {
        console.log(`velocity= ${this.state.v} m/s`);
        [steeringPosition, interpolate2] = this.solveTargetRadius({
          initialPos: steeringPosition,
          interpolate2
        });
        lastSlope = interpolate2.slope;
        interpolate2!.reset();
        if (Math.abs(this.state.lapTime - minLaptimeConverged) < laptimeEps) {
          console.log('laptime converged!');
          break;
        }
        const {v} = this.state;
        if (v > maxVConverged && this.config.storeIntermidiateResults) {
          ss.push(getSnapshot(this));
          maxVConverged = v;
        }
        if (minLaptimeConverged > this.state.lapTime) {
          minLaptimeConverged = this.state.lapTime;
        }
        storedState = this.getSnapshot();
        if (Math.abs(v + deltaV - maxV) < velocityEps) {
          deltaV /= 2;
        }
        this.state.v = v + deltaV;
      } catch (e) {
        console.log(e);
        const {v} = this.state;
        maxV = v;
        if (storedState) this.restoreState(storedState);
        else this.restoreInitialQ();

        if (interpolate2) {
          interpolate2.reset();
          interpolate2.slope = lastSlope;
        }

        deltaV /= 2;
        this.state.v = v - deltaV;
      }
      ++count;
    }
    if (!this.config.storeIntermidiateResults) ss.push(getSnapshot(this));

    const end = performance.now();
    // eslint-disable-next-line no-console
    console.log(`V max solver end...\ntime = ${(end - start).toFixed(1)}`);
    return ss;
  }

  solveTargetRadius({
    initialPos,
    interpolate2,
    getSnapshot,
    ss,
    isMinRadiusMode
  }: {
    initialPos?: number;
    interpolate2?: Interpolate2Points;
    getSnapshot?: (solver: ISolver) => Required<ISnapshot>;
    ss?: Required<ISnapshot>[];
    isMinRadiusMode?: boolean;
  }): [number, Interpolate2Points] {
    const maxCount = this.config.maxLoopCountR.value;
    let count = 0;
    const {steering} = this.config;
    const deltaS = this.config.steeringMaxStepSize.value;
    let steeringPos = initialPos || deltaS;
    const steeringEps = this.config.steeringEps.value;
    const radiusEps = this.config.radiusEps.value;
    const targetRadius = this.config.radius.value;
    let steeringMaxPos =
      deltaS > 0 ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
    let firstSolved = false;
    let storedState: ISnapshot | undefined;
    let storedPos = Number.NaN;
    if (initialPos) storedState = this.getSnapshot();
    const interpolate3 = new Interpolate3Points();
    interpolate2 =
      interpolate2 || new Interpolate2Points(targetRadius, () => deltaS);
    let lastPos = Number.NaN;

    let minRConverged = Number.MAX_SAFE_INTEGER;
    let disableFastExit = false;
    while (count < maxCount) {
      if (Math.abs(lastPos - steeringPos) < steeringEps) {
        if (!isMinRadiusMode) throw new Error('目的の半径に収束しなかった');
        else break;
      }

      steering.valueFormula.formula = `${steeringPos}`;
      steering.set(this);
      try {
        console.log(`steeringPos= ${steeringPos.toFixed(5)}`);
        this.solve({maxCnt: this.config.maxLoopNewton.value});
        if (this.state.rMin > targetRadius) {
          storedState = this.getSnapshot();
          storedPos = steeringPos;
        }
        if (this.state.rMin < targetRadius) disableFastExit = true;
        interpolate3.addNewValue(steeringPos, this.state.rMin);
        interpolate2.addNewValue(steeringPos, this.state.rMin);
        lastPos = steeringPos;
        if (steeringMaxPos === steeringPos) {
          steeringMaxPos =
            deltaS > 0 ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
        }
        if (
          getSnapshot &&
          this.state.rMin < minRConverged &&
          this.config.storeIntermidiateResults
        ) {
          ss?.push(getSnapshot(this));
          minRConverged = this.state.rMin;
        }
      } catch (e: unknown) {
        if (!firstSolved) {
          console.log(
            '初回の計算で収束しなかったため、初期ポジションをリセットする'
          );
          const {v} = this.state;
          this.reConstruct();
          this.state.v = v;
          steeringPos = 0;
          steering.valueFormula.formula = `${steeringPos}`;
          steering.set(this);
          this.solve();
          ++count;
          // eslint-disable-next-line no-continue
          continue;
        } else {
          steeringMaxPos = steeringPos;
          console.log('収束しなかった');
          if (interpolate3.isValid && !disableFastExit) {
            const rEst = interpolate3.getValue(steeringMaxPos);
            console.log(`rEst = ${rEst}`);
            if (
              !isMinRadiusMode &&
              interpolate3.length < Math.abs(deltaS) / 4 &&
              rEst > targetRadius * 1.1
            ) {
              throw new Error('目的の半径に収束しない見込みのため早期終了');
            }
          }
          if (storedState) {
            console.log(`restore steeringPos= ${storedPos.toFixed(5)}`);
            this.restoreState(storedState);
            steeringPos = (storedPos + steeringPos) / 2;

            ++count;
            // eslint-disable-next-line no-continue
            continue;
          } else throw e;
        }
      }
      if (this.state.rMin < targetRadius && !firstSolved) {
        console.log(
          '初回の計算で半径が負になったため、初期ポジションをリセットする'
        );
        const {v} = this.state;
        this.reConstruct();
        this.state.v = v;
        steeringPos = 0;
        steering.valueFormula.formula = `${steeringPos}`;
        steering.set(this);
        this.solve();
        steeringPos = 0;
        ++count;

        // eslint-disable-next-line no-continue
        continue;
      }
      firstSolved = true;
      if (
        firstSolved &&
        Math.abs(this.state.rMin - targetRadius) < radiusEps &&
        !isMinRadiusMode
      ) {
        console.log('半径が収束');
        break;
      }
      if (this.state.rMin < targetRadius && storedState) {
        console.log(`restore steeringPos= ${storedPos.toFixed(5)}`);
        this.restoreState(storedState);
      }
      steeringPos = interpolate2.predict(steeringPos);
      if (
        (deltaS > 0 && steeringPos > steeringMaxPos) ||
        (deltaS < 0 && steeringPos < steeringMaxPos)
      ) {
        steeringPos = steeringMaxPos;
      }

      ++count;
    }
    if (count === maxCount) {
      console.log('solver target radius がmaxCountに到達');
      throw new Error('max count');
    }
    console.log('reached the radius goal');

    if (!this.config.storeIntermidiateResults && getSnapshot)
      ss?.push(getSnapshot(this));
    return [steeringPos, interpolate2];
  }

  solveTargetRadiusStable({
    initialPos,
    interpolate2,
    getSnapshot,
    ss,
    isMinRadiusMode
  }: {
    initialPos?: number;
    interpolate2?: Interpolate2Points;
    getSnapshot?: (solver: ISolver) => Required<ISnapshot>;
    ss?: Required<ISnapshot>[];
    isMinRadiusMode?: boolean;
  }): [number, Interpolate2Points] {
    const maxCount = this.config.maxLoopCountR.value;
    let count = 0;
    const {steering} = this.config;
    let deltaS = this.config.steeringMaxStepSize.value;
    let steeringPos = initialPos || deltaS;
    const steeringEps = this.config.steeringEps.value;
    const radiusEps = this.config.radiusEps.value;
    const targetRadius = this.config.radius.value;
    let rMinMin = Number.MAX_SAFE_INTEGER;
    let steeringMaxPos = 0;
    let firstSolved = false;
    let storedState: ISnapshot | undefined;
    if (initialPos) storedState = this.getSnapshot();
    let lastPos = Number.NaN;
    const interpolate3 = new Interpolate3Points();
    interpolate2 =
      interpolate2 || new Interpolate2Points(targetRadius, () => deltaS);
    let minRConverged = Number.MAX_SAFE_INTEGER;
    let disableFastExit = false;
    while (count < maxCount) {
      if (Math.abs(lastPos - steeringPos) < steeringEps) {
        if (!isMinRadiusMode) throw new Error('目的の半径に収束しなかった');
        else break;
      }
      steering.valueFormula.formula = `${steeringPos}`;
      steering.set(this);
      try {
        this.solve({maxCnt: this.config.maxLoopNewton.value});
        if (this.state.rMin > targetRadius) storedState = this.getSnapshot();
        interpolate3.addNewValue(steeringPos, this.state.rMin);
        lastPos = steeringPos;
        if (this.state.rMin < targetRadius) disableFastExit = true;
        if (
          getSnapshot &&
          this.state.rMin < minRConverged &&
          this.config.storeIntermidiateResults
        ) {
          ss?.push(getSnapshot(this));
          minRConverged = this.state.rMin;
        }
      } catch (e: unknown) {
        ++count;
        if (!firstSolved) {
          console.log(
            '初回の計算で収束しなかったため、初期ポジションを修正する'
          );
          if (!initialPos) {
            deltaS /= 2;
            steeringPos -= deltaS;
          } else {
            if (storedState) this.restoreState(storedState);
            steeringPos -= deltaS;
          }
          // eslint-disable-next-line no-continue
          continue;
        } else {
          // steeringMaxPos = steeringPos;
          if (interpolate3.isValid && !disableFastExit) {
            const rEst = interpolate3.getValue(steeringPos);
            console.log(`rEst = ${rEst}`);
            if (!isMinRadiusMode && rEst > targetRadius + 0.01) {
              throw new Error('目的の半径に収束しない見込みのため早期終了');
            }
          }
          steeringPos -= deltaS / 2;
          deltaS /= 2;
          console.log(`deltaS修正: deltaS= ${deltaS}`);
          if (storedState) {
            this.restoreState(storedState);
            // eslint-disable-next-line no-continue
            continue;
          } else throw e;
        }
      }
      if (firstSolved && Math.abs(this.state.rMin - targetRadius) < radiusEps)
        break;
      if (rMinMin < this.state.rMin) {
        if (!firstSolved) {
          console.log(
            '初回の計算で半径が負になったため、初期のステアリングポジションを修正'
          );
          if (!initialPos) {
            deltaS /= 2;
          }
          steeringPos -= deltaS;
          // eslint-disable-next-line no-continue
          continue;
        }
        console.log('警告：ステアを切っても半径が減らない');
      }
      firstSolved = true;
      if (this.state.rMin > targetRadius) {
        rMinMin = this.state.rMin;
        steeringPos += deltaS;
        if (Math.abs(steeringMaxPos - steeringPos) < steeringEps) {
          deltaS /= 2;
          steeringPos -= deltaS;
          console.log(`deltaS修正: deltaS= ${deltaS}`);
        }
      } else {
        steeringMaxPos = steeringPos;
        if (storedState) {
          this.restoreState(storedState);
        }
        deltaS /= 2;
        steeringPos -= deltaS;
        console.log(`deltaS修正: deltaS= ${deltaS}`);
      }
      ++count;
    }
    console.log('reached the radius goal');

    if (!this.config.storeIntermidiateResults && getSnapshot)
      ss?.push(getSnapshot(this));
    return [steeringPos, interpolate2];
  }

  // ポストプロセス： 要素への位置の反映と、Restorerの適用
  postProcess(updateValues?: boolean): void {
    // Componentの位置、回転をElementに反映
    this.components.forEach((components) =>
      components.forEach((component) => component.applyResultToApplication())
    );
    // 簡略化したElementに計算結果を反映する
    const unresolvedPoints = Object.keys(this.pointComponents).reduce(
      (prev, current) => {
        prev[current] = this.pointComponents[current].position
          .clone()
          .multiplyScalar(1 / this.pointComponents[current].scale);
        return prev;
      },
      {} as {[key: string]: Vector3}
    );
    this.restorers.forEach((restorer) => {
      restorer.restore(unresolvedPoints);
    });
    this.components.forEach((components) => {
      const constraints = components[0].unionFindTreeConstraints;
      constraints.forEach((constraint) => {
        if (isBalance(constraint)) {
          constraint.applytoElement(updateValues);
        }
      });
    });

    const elements = this.assembly.children;
    let minDistance = Number.MAX_SAFE_INTEGER;
    const center = new Vector3(0, this.state.r * 1000, 0);
    const normal = new Vector3(0, 0, 1);
    elements.forEach((element) => {
      const {distance} = element.obb.getNearestNeighborToLine(
        center,
        normal,
        element.position.value,
        element.rotation.value
      );
      if (distance < minDistance) minDistance = distance;
    });
    this.state.rMin = (minDistance * (this.state.r > 0 ? 1 : -1)) / 1000;
    console.log(`true radius=     ${this.state.rMin.toFixed(4)} m`);
  }

  // eslint-disable-next-line class-methods-use-this
  get variables(): PlotVariables[] {
    const names: (keyof ISolverState)[] = [
      'lapTime',
      'omega',
      'r',
      'rMin',
      'v'
    ];
    return names.map((name) => ({name, key: name}));
  }

  getVariable(key: keyof ISolverState): number {
    return this.state[key];
  }
}

export interface PlotVariables {
  name: keyof ISolverState;
  key: string;
}

export function isSkidpadSolver(
  solver: ISolver | undefined
): solver is SkidpadSolver {
  if (!solver) return false;
  return solver.className === SkidpadSolver.className;
}

class Interpolate2Points {
  last2X: number[] = [];

  last2Y: number[] = [];

  targetY: number;

  deltaXMax: () => number;

  slope: number = Number.NaN;

  constructor(targetY: number, deltaXMax: () => number) {
    this.targetY = targetY;
    this.deltaXMax = deltaXMax;
  }

  reset() {
    this.last2X = [];
    this.last2Y = [];
  }

  predict(current: number) {
    const {abs} = Math;
    if (!this.isValid) {
      return current + this.deltaXMax();
    }
    const x = (this.targetY - this.last2Y[0]) / this.slope + this.last2X[0];
    const deltaMax = this.deltaXMax();
    if (
      (deltaMax > 0 && x - current > deltaMax) ||
      (deltaMax < 0 && x - current < deltaMax)
    ) {
      return current + deltaMax;
    }
    if (
      (deltaMax > 0 && x - current < -deltaMax) ||
      (deltaMax < 0 && x - current > -deltaMax)
    ) {
      return current - deltaMax;
    }
    if (this.last2Y[1] > this.targetY) {
      if (
        (deltaMax > 0 && x - current < deltaMax) ||
        (deltaMax < 0 && x - current > deltaMax)
      ) {
        return current + deltaMax;
      }
    }
    return x;
  }

  addNewValue(x: number, y: number) {
    // targetY > 0
    // last2Y[0] > last2Y[1]
    const {targetY, last2X, last2Y} = this;
    if (last2X.length < 2) {
      last2X.push(x);
      last2Y.push(y);
      if (last2X.length === 2) {
        if (last2Y[1] > last2Y[0]) {
          this.last2X = [last2X[1], last2X[0]];
          this.last2Y = [last2Y[1], last2Y[0]];
        }

        this.slope =
          (this.last2Y[1] - this.last2Y[0]) / (this.last2X[1] - this.last2X[0]);
        return;
      }
    }

    const {abs, max} = Math;
    if (y < targetY) {
      // --,- or ++,- or +-,-
      if (last2Y.every((y) => y - targetY < 0)) {
        if (y > last2Y[0]) {
          this.last2X = [x, last2X[0]];
          this.last2Y = [y, last2Y[0]];
        } else if (y > last2Y[1]) {
          last2X[1] = x;
          last2Y[1] = y;
        }
      } else if (last2Y.every((y) => y - targetY > 0)) {
        this.last2X = [last2X[1], x];
        this.last2Y = [last2Y[1], y];
      } else {
        // eslint-disable-next-line no-lonely-if
        if (y > last2Y[1]) {
          last2X[1] = x;
          last2Y[1] = y;
        }
      }
    } else {
      // --,+ or ++,+ or +-,+
      // eslint-disable-next-line no-lonely-if
      if (last2Y.every((y) => y - targetY < 0)) {
        this.last2X = [x, last2X[0]];
        this.last2Y = [y, last2Y[0]];
      } else if (last2Y.every((y) => y - targetY > 0)) {
        if (y < last2Y[1]) {
          this.last2X = [last2X[0], x];
          this.last2Y = [last2Y[0], y];
        } else if (y < last2Y[0]) {
          last2X[0] = x;
          last2Y[0] = y;
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (y < last2Y[0]) {
          last2X[0] = x;
          last2Y[0] = y;
        }
      }
    }

    this.slope =
      (this.last2Y[1] - this.last2Y[0]) / (this.last2X[1] - this.last2X[0]);
  }

  get isValid() {
    const a = this.last2X.length === 2;
    const b = this.last2X.length > 1 && !Number.isNaN(this.slope);
    return a || b;
  }
}

class Interpolate3Points {
  last3X: number[] = [];

  last3Y: number[] = [];

  get length() {
    return Math.max(...this.last3X) - Math.min(...this.last3X);
  }

  addNewValue(x: number, y: number) {
    this.last3X.push(x);
    this.last3Y.push(y);
    if (this.last3X.length > 3) this.last3X.shift();
    if (this.last3Y.length > 3) this.last3Y.shift();
  }

  get isValid() {
    return this.last3X.length === 3 && this.last3Y.length === 3;
  }

  getValue(x: number) {
    const X = this.last3X;
    const Y = this.last3Y;
    /* const a1 = (Y[0] - Y[1]) * (X[0] - X[2]) - (Y[0] - Y[2]) * (X[0] - X[1]);
    const a2 = (X[0] - X[1]) * (X[0] - X[2]) * (X[1] - X[2]);
    const a = a1 / a2;
    const b = (Y[0] - Y[1]) / (X[0] - X[1]) - a * (X[0] + X[1]);
    const c = Y[0] - a * X[0] * X[1] - b * X[0]; */

    const D = det([
      [X[0] ** 2, X[0], 1],
      [X[1] ** 2, X[1], 1],
      [X[2] ** 2, X[2], 1]
    ]);
    const a =
      det([
        [Y[0], X[0], 1],
        [Y[1], X[1], 1],
        [Y[2], X[2], 1]
      ]) / D;
    const b =
      det([
        [X[0] ** 2, Y[0], 1],
        [X[1] ** 2, Y[1], 1],
        [X[2] ** 2, Y[2], 1]
      ]) / D;
    const c =
      det([
        [X[0] ** 2, X[0], Y[0]],
        [X[1] ** 2, X[1], Y[1]],
        [X[2] ** 2, X[2], Y[2]]
      ]) / D;

    const v = a * x * x + b * x + c;
    const min = -(b * b - 4 * a * c) / (4 * a);
    const minRight = this.last3X[0] < x;
    if (minRight) {
      if (a > 0) {
        if (x < -b / (2 * a)) return v;
        return Number.MIN_SAFE_INTEGER;
      }
      return v;
    }
    if (a > 0) {
      if (x > -b / (2 * a)) return v;
      return Number.MIN_SAFE_INTEGER;
    }
    return v;
  }
}

function det(d: number[][]): number {
  const a = d[0];
  const b = d[1];
  const c = d[2];
  return (
    a[0] * b[1] * c[2] +
    a[1] * b[2] * c[0] +
    a[2] * b[0] * c[1] -
    a[2] * b[1] * c[0] -
    a[1] * b[0] * c[2] -
    a[0] * b[2] * c[1]
  );
}
