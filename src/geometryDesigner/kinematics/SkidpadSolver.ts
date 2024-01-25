/* eslint-disable camelcase */
/* eslint-disable no-lone-blocks */
import {Matrix, SingularValueDecomposition} from 'ml-matrix';
import {Control} from '@gd/controls/IControls';
import {IElement, IAssembly, isSimplifiedElement} from '@gd/IElements';
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
import {Triple, Twin, OneOrTwo} from '@utils/atLeast';
import {getTire} from '@tire/listTireData';
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
  ConstraintsOptions,
  Constraint,
  Sphere,
  Hinge,
  BarAndSpheres,
  LinearBushingSingleEnd,
  PointToPlane,
  hasDl,
  controled
} from './Constraints';
import {
  BarBalance,
  AArmBalance,
  TireBalance,
  LinearBushingBalance,
  FDComponentBalance
} from './SkidpadConstraints';
import {
  IComponent,
  FullDegreesComponent,
  isFullDegreesComponent,
  PointComponent,
  PointForce,
  GeneralVariable
} from './KinematicComponents';

export class SkidpadSolver {
  assembly: IAssembly;

  components: IComponent[][];

  pointComponents: {[index: string]: PointComponent} = {};

  componentsFromNodeID: {[index: string]: IComponent};

  restorers: Restorer[] = [];

  running: boolean = false;

  firstSolved = false;

  constructor(
    assembly: IAssembly,
    config: ISteadySkidpadParams,
    controlsAll: {[index: string]: Control[]},
    solve?: boolean
  ) {
    const vO = () => new Vector3(10, 0, 0);
    this.assembly = assembly;
    const {children} = assembly;
    const controls = Object.keys(controlsAll).reduce((dict, key) => {
      const cls = controlsAll[key].filter(
        (f) => f.nodeID === config.stearing.target
      );
      if (cls.length > 0) {
        dict[key] = cls;
      }
      return dict;
    }, {} as {[index: string]: Control[]});
    const joints = assembly.getJointsAsVector3();
    const jointDict = getJointDictionary(children, joints);
    const constraints: Constraint[] = [];
    const components: IComponent[] = [];
    const jointsDone = new Set<JointAsVector3>();
    const pointForceComponents: {[index: string]: PointForce} = {};
    const tempComponents: {[index: string]: FullDegreesComponent} = {};
    const tempElements: {[index: string]: IElement} = {};
    let specialControls: {[index: string]: Control[]} = {};

    const omega = new GeneralVariable('omega');
    const error = new GeneralVariable('longitudinalForceError');
    components.push(omega);
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
        tempComponents[element.nodeID] = new FullDegreesComponent(element);
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
              otherElement,
              joints
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
          const joints = element.fixedPoints.map((p) => {
            const joint = jointDict[p.nodeID][0];
            const [pf, isNew] = getPFComponent(pointForceComponents, joint);
            pfs.push(pf);
            if (isNew) components.push(pf);
            jointsDone.add(joint);
            return joint;
          });
          const jointu = jointDict[element.points[0].nodeID][0];
          // 力コンポーネント
          const [pf, isNew] = getPFComponent(pointForceComponents, jointu);
          pfs.push(pf);
          if (isNew) components.push(pf);
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
              vO,
              omega
            })
          );
          return;
        }
        // BarはComponent扱いしない
        if (isBar(element) || isSpringDumper(element)) {
          const pfs: PointForce[] = [];
          const jointf = jointDict[element.fixedPoint.nodeID][0];
          const jointp = jointDict[element.point.nodeID][0];
          const [pff, isNewf] = getPFComponent(pointForceComponents, jointf);
          pfs.push(pff);
          if (isNewf) components.push(pff);
          const [pfp, isNewp] = getPFComponent(pointForceComponents, jointp);
          pfs.push(pfp);
          if (isNewp) components.push(pfp);
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
            if (!(points[0].nodeID in pointComponents)) {
              pointComponents[element.fixedPoint.nodeID] = new PointComponent(
                element.fixedPoint,
                points[0]
              );
              lhs = pointComponents[element.fixedPoint.nodeID];
              components.push(lhs);
            } else {
              // eslint-disable-next-line no-multi-assign
              lhs = pointComponents[element.fixedPoint.nodeID] =
                pointComponents[points[0].nodeID];
            }
          }
          if (!rhs) {
            if (!(points[1].nodeID in pointComponents)) {
              pointComponents[element.point.nodeID] = new PointComponent(
                element.point,
                points[1]
              );
              rhs = pointComponents[element.point.nodeID];
              components.push(rhs);
            } else {
              // eslint-disable-next-line no-multi-assign
              rhs = pointComponents[element.fixedPoint.nodeID] =
                pointComponents[points[1].nodeID];
            }
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
          constraints.push(
            new BarBalance({
              name: `BarBalance of${element.name.value}`,
              components: [lhs, rhs],
              points: [
                isFullDegreesComponent(lhs) ? points[0].value : new Vector3(),
                isFullDegreesComponent(rhs) ? points[1].value : new Vector3()
              ],
              mass: element.mass.value,
              cog: 0.5, // 要修正
              pfs: pfs as Twin<PointForce>,
              vO,
              omega
            })
          );
          return;
        }
        // Tireはコンポーネント扱いしない
        if (isTire(element)) {
          if (canSimplifyTire(element, jointDict)) {
            const pfs: PointForce[] = [];
            const jointl = jointDict[element.leftBearing.nodeID][0];
            const jointr = jointDict[element.rightBearing.nodeID][0];
            const [pfl, isNewl] = getPFComponent(pointForceComponents, jointl);
            pfs.push(pfl);
            if (isNewl) components.push(pfl);
            const [pfr, isNewr] = getPFComponent(pointForceComponents, jointr);
            pfs.push(pfr);
            if (isNewr) components.push(pfr);
            jointsDone.add(jointl);
            jointsDone.add(jointr);
            const points = [
              getJointPartner(jointl, element.leftBearing.nodeID),
              getJointPartner(jointr, element.rightBearing.nodeID)
            ];
            this.restorers.push(
              new TireRestorer(element, points[0], points[1])
            );
            // TireBalance
            const torqueRatioSum = Object.keys(config.tireTorqueRatio).reduce(
              // eslint-disable-next-line no-return-assign
              (prev, id) => (prev += config.tireTorqueRatio[id]),
              0
            );
            const [component, func] = getSimplifiedTireConstrainsParams(
              element,
              jointDict,
              tempComponents,
              'nearestNeighbor'
            );
            const normal = new Vector3(0, 0, 1);
            const tire = getTire(config.tireData[element.nodeID] ?? '');
            constraints.push(
              new TireBalance({
                name: `TireBalance of${element.name.value}`,
                component,
                points: [points[0].value, points[1].value],
                mass: element.mass.value,
                cog: 0.5, // 要修正
                pfs: pfs as Twin<PointForce>,
                vO,
                omega,
                torqueRatio:
                  config.tireTorqueRatio[element.nodeID] / torqueRatioSum,
                getFriction: (sa, ia, fz) => {
                  // 要修正
                  const {fx, fy} = tire.get({sa, sl: 0, fz, ia});
                  return new Vector3(fx, fy, 0);
                },
                error,
                ground: () => func(normal, 0)
              })
            );
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
          const jointf0 = jointDict[element.fixedPoints[0].nodeID][0];
          const jointf1 = jointDict[element.fixedPoints[1].nodeID][0];
          const fixedPoints = [
            getJointPartner(jointf0, element.fixedPoints[0].nodeID),
            getJointPartner(jointf1, element.fixedPoints[1].nodeID)
          ];
          const [pf0, isNew0] = getPFComponent(pointForceComponents, jointf0);
          pfsFrame.push(pf0);
          if (isNew0) components.push(pf0);
          const [pf1, isNew1] = getPFComponent(pointForceComponents, jointf1);
          pfsFrame.push(pf1);
          if (isNew1) components.push(pf1);
          jointsDone.add(jointf0);
          jointsDone.add(jointf1);
          const node0: (Vector3 | undefined)[] = [];
          const component0: IComponent[] = [];
          const rodEndComponents: IComponent[] = [];
          const rodEndPoints: Vector3[] = [];
          const frameComponent =
            tempComponents[fixedPoints[0].parent?.nodeID ?? ''];
          if (!frameComponent) throw new Error('frameComponentが見つからない');
          element.points.forEach((point, i) => {
            const jointp = jointDict[point.nodeID][0];
            const [pf, isNew] = getPFComponent(pointForceComponents, jointp);
            pfsRodEnd.push(pf);
            if (isNew) components.push(pf);
            jointsDone.add(jointp);
            const points = [
              ...fixedPoints,
              getJointPartner(jointp, point.nodeID)
            ];
            const elements = points.map((p) => p.parent as IElement);
            let rhs: IComponent = tempComponents[elements[2].nodeID];
            if (!rhs) {
              if (!(points[2].nodeID in pointComponents)) {
                pointComponents[point.nodeID] = new PointComponent(
                  point,
                  points[2]
                );
                rhs = pointComponents[point.nodeID];
                components.push(rhs);
              } else {
                // eslint-disable-next-line no-multi-assign
                rhs = pointComponents[point.nodeID] =
                  pointComponents[points[2].nodeID];
              }
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
              tempComponents[elements[0].nodeID],
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
              frameComponent,
              framePoints: [fixedPoints[0].value, fixedPoints[1].value],
              rodEndComponents: rodEndComponents as OneOrTwo<IComponent>,
              rodEndPoints: rodEndPoints as OneOrTwo<Vector3>,
              cog: fixedPoints[0].value
                .add(fixedPoints[1].value)
                .multiplyScalar(0.5), // 要修正
              pfsFrame: pfsFrame as Twin<PointForce>,
              pfsRodEnd: pfsRodEnd as OneOrTwo<PointForce>,
              mass: element.mass.value,
              vO,
              omega
            })
          );
        }
        // TorsionSpringはComponent扱いしない
        if (isTorsionSpring(element)) {
          const jointf0 = jointDict[element.fixedPoints[0].nodeID][0];
          const jointf1 = jointDict[element.fixedPoints[1].nodeID][0];
          jointsDone.add(jointf0);
          jointsDone.add(jointf1);
          // 固定点の相手先を見つける
          const fixedPoints = [
            getJointPartner(jointf0, element.fixedPoints[0].nodeID),
            getJointPartner(jointf1, element.fixedPoints[1].nodeID)
          ];
          const effortPoints: typeof fixedPoints = [];
          const rhss: IComponent[] = [];
          element.effortPoints.forEach((ep) => {
            const jointp = jointDict[ep.nodeID][0];
            jointsDone.add(jointp);
            const epp = getJointPartner(jointp, ep.nodeID);
            effortPoints.push(epp);
            const points = [...fixedPoints, epp];
            const elements = points.map((p) => p.parent as IElement);
            let rhs: IComponent = tempComponents[elements[2].nodeID];
            if (!rhs) {
              if (!(points[2].nodeID in pointComponents)) {
                pointComponents[ep.nodeID] = new PointComponent(ep, points[2]);
                rhs = pointComponents[ep.nodeID];
                components.push(rhs);
              } else {
                // eslint-disable-next-line no-multi-assign
                rhs = pointComponents[ep.nodeID] =
                  pointComponents[points[2].nodeID];
              }
            }
            rhss.push(rhs);
            // あまりないと思うが、すべての点が同じコンポーネントに接続されている場合無視する
            if (
              elements[0].nodeID === elements[2].nodeID ||
              (isFixedElement(elements[0]) && isFixedElement(elements[2]))
            ) {
              return;
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
            rhss[0],
            rhss[1],
            element.effortPoints[0].value
              .sub(element.effortPoints[1].value)
              .length(),
            [],
            isFullDegreesComponent(rhss[0]) ? effortPoints[0].value : undefined,
            isFullDegreesComponent(rhss[1]) ? effortPoints[1].value : undefined,
            true
          );
          constraints.push(constraint);
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
                  const [pComponent, localVec] =
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
                    localVec,
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
                    (normal, distance) => {
                      return element.getNearestNeighborToPlane(
                        normal,
                        distance
                      );
                    },
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
                    const p = point.value;
                    const constraint = new PointToPlane(
                      `Two-dimentional Constraint of ${point.name} of ${element.name.value}`,
                      component,
                      () => p,
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
        joints.forEach((joint) => {
          const [pf, isNew] = getPFComponent(pointForceComponents, joint);
          pfs.push(pf);
          if (isNew) components.push(pf);
          const [pThis] = getNamedVector3FromJoint(joint, element.nodeID);
          points.push(pThis.value);
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

        // FDComponentBalance
        constraints.push(
          new FDComponentBalance({
            name: `FDComponentBalance of${element.name.value}`,
            component,
            mass: element.mass.value,
            cog: element.centerOfGravity.value,
            points,
            pointForceComponents: pfs,
            vO,
            omega
          })
        );
      });
      // フレームをピン止めする
      const frame = children.find((e) => e.meta?.isBodyOfFrame) as IBody;
      const p = frame.centerOfGravity.value;
      const component = tempComponents[frame.nodeID];
      constraints.push(
        new PointToPlane(
          `Two-dimentional Constraint of ${frame.centerOfGravity.name} of ${frame.name.value}`,
          component,
          () => p,
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
          () => p,
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
          const constraintToNormalize = component.getConstraintToNormalize();
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
    if (solve)
      this.solve({
        constraintsOptions: {onAssemble: true},
        postProcess: true,
        logOutput: true
      });
  }

  getGroupItBelongsTo(component: IComponent): [IComponent, IComponent[]] {
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
  }): void {
    if (this.running) return;
    this.running = true;
    try {
      const start = performance.now();
      const maxCnt = params?.maxCnt ?? 200;
      const postProcess = params?.postProcess ?? true;
      const constraintsOptions = params?.constraintsOptions ?? {};
      const logOutput = params?.logOutput ?? false;

      // Kinematicソルバを解く
      this.components.forEach((components) => {
        const root = components[0];
        const constraints = root
          .getGroupedConstraints()
          .filter((constraint) => constraint.active(constraintsOptions));

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
          }).solve(matPhi);

          // 差分を反映
          components.forEach((component) => component.applyDq(dq));

          const norm = dq.norm('frobenius');
          eq = norm < 1.0e-4;
          // console.log(`norm=${norm.toFixed(3)}`);
          if (norm > minNorm * 1000 || Number.isNaN(norm)) {
            // eslint-disable-next-line no-console
            console.log(`norm=${norm.toFixed(3)}`);
            // eslint-disable-next-line no-console
            console.log('収束していない');
            throw new Error('ニュートンラプソン法収束エラー');
          }
          if (norm < minNorm) {
            minNorm = norm;
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
      if (!this.firstSolved) {
        this.components.forEach((components) => {
          components.forEach((component) => component.saveInitialQ());
        });
      }
      this.firstSolved = true;

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

  async wait(): Promise<void> {
    // eslint-disable-next-line no-await-in-loop
    while (this.running) await sleep(10);
  }

  restoreInitialQ() {
    try {
      if (!this.firstSolved) {
        this.solve();
        return;
      }
      this.components.forEach((components) => {
        components[0].getGroupedConstraints().forEach((c) => c.resetStates());
        components.forEach((component) => component.restoreInitialQ());
      });

      const roots = this.components.map((c) => c[0]);
      roots.forEach((root) => {
        root.getGroupedConstraints().forEach((c) => {
          if (hasDl(c)) c.dl = 0;
        });
      });
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
      constrainsState: this.components.reduce((prev, components, i) => {
        components[0].getGroupedConstraints().forEach((c, j) => {
          if (controled(c)) prev[`${j}@${i}`] = c.dl;
        });
        return prev;
      }, {} as {[index: string]: number})
    };
  }

  restoreState(snapshot: ISnapshot): void {
    const {dofState, constrainsState} = snapshot;
    this.components.forEach((components, i) => {
      components.forEach((component, j) => {
        component.restoreState(dofState[`${j}@${i}`]);
      });
      components[0].getGroupedConstraints().forEach(
        // eslint-disable-next-line no-return-assign
        (c, j) => controled(c) && (c.dl = constrainsState[`${j}@${i}`])
      );
    });
  }

  // ポストプロセス： 要素への位置の反映と、Restorerの適用
  postProcess(): void {
    // Componentの位置、回転をElementに反映
    this.components.forEach((components) =>
      components.forEach((component) => component.applyResultToElement())
    );
    // 簡略化したElementに計算結果を反映する
    const unresolvedPoints = Object.keys(this.pointComponents).reduce(
      (prev, current) => {
        prev[current] = this.pointComponents[current].position.clone();
        return prev;
      },
      {} as {[key: string]: Vector3}
    );
    this.restorers.forEach((restorer) => {
      restorer.restore(unresolvedPoints);
    });
  }
}
