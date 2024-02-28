/* eslint-disable camelcase */
/* eslint-disable no-lone-blocks */
import {Matrix, SingularValueDecomposition} from 'ml-matrix';
import {Control, IDataControl} from '@gd/controls/IControls';
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
import {Constraint, ConstraintsOptions} from '@gd/kinematics/IConstraint';
import {ConstantVector3} from '@computationGraph/ConstantVector3';
import {
  getJointDictionary,
  canSimplifyAArm,
  canSimplifyTire,
  getJointPartner,
  isFixedElement,
  getJointsToOtherComponents,
  getNamedVector3FromJoint,
  getSimplifiedTireConstrainsParams,
  elementIsComponent
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
import {IObjectiveFunction} from './Driver';
import {
  Sphere,
  Hinge,
  BarAndSpheres,
  LinearBushingSingleEnd,
  PointToPlane
} from './KinematicConstraints';
import {
  IComponent,
  FullDegreesComponent,
  isFullDegreesComponent,
  PointComponent
} from './KinematicComponents';
import {ISnapshot} from '../analysis/ISnapshot';
import {ISolver} from './ISolver';

export class KinematicsSolver implements ISolver {
  static className = 'KinematicsSolver' as const;

  readonly className = KinematicsSolver.className;

  assembly: IAssembly;

  components: IComponent[][];

  pointComponents: {[index: string]: PointComponent};

  componentsFromNodeID: {[index: string]: IComponent};

  restorers: Restorer[];

  running: boolean = false;

  get firstSolved() {
    return !!this.firstSnapshot;
  }

  firstSnapshot: ISnapshot | undefined;

  scale: number;

  controls: {[index: string]: Control[]};

  assemblyMode: NonNullable<IDataControl['configuration']>;

  pinFrameCOV: boolean;

  faceForward: boolean;

  constructor(
    assembly: IAssembly,
    assemblyMode: NonNullable<IDataControl['configuration']>,
    pinFrameCOV: boolean,
    faceForward: boolean,
    controls: {[index: string]: Control[]},
    scale: number,
    solve?: boolean
  ) {
    this.assembly = assembly;
    this.scale = scale;
    this.controls = controls;
    this.pinFrameCOV = pinFrameCOV;
    this.faceForward = faceForward;
    this.assemblyMode = assemblyMode;
    this.components = [];
    this.pointComponents = {};
    this.componentsFromNodeID = {};
    this.restorers = [];
    this.reConstruct();

    if (solve)
      this.solve({
        constraintsOptions: {
          disableSpringElasticity: true,
          fixLinearBushing: true
        },
        postProcess: true,
        logOutput: true
      });
  }

  reConstruct() {
    this.components = [];
    this.pointComponents = {};
    this.componentsFromNodeID = {};
    this.restorers = [];
    this.firstSnapshot = undefined;
    const {scale, controls, assemblyMode, pinFrameCOV, faceForward, assembly} =
      this;
    assembly.arrange();
    const {children} = assembly;

    const joints = this.assembly.getJointsAsVector3();
    const jointDict = getJointDictionary(children, joints);
    const constraints: Constraint[] = [];
    const components: IComponent[] = [];
    const jointsDone = new Set<JointAsVector3>();
    const tempComponents: {[index: string]: FullDegreesComponent} = {};
    const tempElements: {[index: string]: IElement} = {};
    let specialControls: {[index: string]: Control[]} = {};

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
      // assemblyModeがAllTiresGroundedの場合
      if (assemblyMode === 'AllTiresGrounded') {
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
    }
    // ステップ4: コンポーネント化しないElementを幾何拘束へ変換
    {
      const {pointComponents} = this;
      children.forEach((element) => {
        // AArmが単独で使われている場合は、BarAndSpheres2つに変更する。
        if (isAArm(element) && canSimplifyAArm(element, jointDict)) {
          const joints = element.fixedPoints.map((p) => {
            const joint = jointDict[p.nodeID][0];
            jointsDone.add(joint);
            return joint;
          });
          const jointu = jointDict[element.points[0].nodeID][0];
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
          // あまりないと思うが、AArmのすべての点が同じコンポーネントに接続されている場合無視する
          if (
            body.nodeID === upright.nodeID ||
            (isFixedElement(body) && isFixedElement(upright))
          ) {
            return;
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
          return;
        }
        // BarはComponent扱いしない
        if (isBar(element) || isSpringDumper(element)) {
          const jointf = jointDict[element.fixedPoint.nodeID][0];
          const jointp = jointDict[element.point.nodeID][0];
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
                points[0],
                scale
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
                points[1],
                scale
              );
              rhs = pointComponents[element.point.nodeID];
              components.push(rhs);
            } else {
              // eslint-disable-next-line no-multi-assign
              rhs = pointComponents[element.point.nodeID] =
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
          } else {
            throw new Error(
              'タイヤの軸は同じコンポーネントに接続される必要がある'
            );
            // 2023.06.17 二つ以上のコンポーネントにまたがるタイヤは、
            // 一つのコンポーネント扱いとするように変更(接地点の計算が面倒極まるため)
            // 計算負荷は虫すすことにする。
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
          const jointf0 = jointDict[element.fixedPoints[0].nodeID][0];
          const jointf1 = jointDict[element.fixedPoints[1].nodeID][0];
          const fixedPoints = [
            getJointPartner(jointf0, element.fixedPoints[0].nodeID),
            getJointPartner(jointf1, element.fixedPoints[1].nodeID)
          ];
          jointsDone.add(jointf0);
          jointsDone.add(jointf1);
          const node0: (Vector3 | undefined)[] = [];
          const component0: IComponent[] = [];
          element.points.forEach((point, i) => {
            const jointp = jointDict[point.nodeID][0];
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
                  points[2],
                  scale
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

            // あまりないと思うが、AArmのすべての点が同じコンポーネントに接続されている場合無視する
            if (
              elements[0].nodeID === elements[2].nodeID ||
              (isFixedElement(elements[0]) && isFixedElement(elements[2]))
            ) {
              return;
            }

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
                pointComponents[ep.nodeID] = new PointComponent(
                  ep,
                  points[2],
                  scale
                );
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
      });
      // フレームをピン止めする
      if (assemblyMode === 'AllTiresGrounded') {
        const frame = children.find((e) => e.meta?.isBodyOfFrame) as IBody;
        if (pinFrameCOV && frame) {
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
          if (faceForward) {
            const p2 = p
              .clone()
              .add(new Vector3(1000, 0, 0).multiplyScalar(scale));
            constraints.push(
              new PointToPlane(
                `Two-dimentional Constraint of front direction of ${frame.name.value}`,
                component,
                () => new ConstantVector3(p2),
                new Vector3(),
                new Vector3(0, 1, 0),
                frame.nodeID,
                [],
                0,
                0
              )
            );
          }
        }
      }
    }
    // ステップ5: グルーピング
    // Union Find Treeを用いてグルーピングを実施する。
    {
      constraints.forEach((constraint) => {
        const freeComponents = constraint.relevantVariables.filter(
          (c) => !isFullDegreesComponent(c) || !c.isFixed
        );
        freeComponents.forEach((c, i) => {
          if (i === 0) {
            c.root.unionFindTreeConstraints.push(constraint);
            return;
          }
          freeComponents[0].unite(c);
        });
      });
      const rootComponents = components.filter((component) => component.isRoot);
      this.components = rootComponents.map((root) => {
        const grouped = [
          root,
          ...components.filter(
            (component) => component.root === root && component !== root
          )
        ];
        grouped.forEach((component) => {
          const constraintToNormalize = isFullDegreesComponent(component)
            ? component.getConstraintToNormalize()
            : null;
          if (constraintToNormalize) {
            root.unionFindTreeConstraints.push(constraintToNormalize);
          }
        });
        return grouped;
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
          phi_q.mul(0);
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
        this.firstSnapshot = this.getSnapshot();
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

  async wait(): Promise<void> {
    // eslint-disable-next-line no-await-in-loop
    while (this.running) await sleep(10);
  }

  solveObjectiveFunction(
    func: IObjectiveFunction,
    params?: {
      maxCnt?: number;
      constraintsOptions?: ConstraintsOptions;
      ignoreInequalityConstraints?: boolean;
      postProcess?: boolean;
      logOutput?: boolean;
    }
  ) {
    if (this.running) return;
    this.running = true;
    const constraintsOptions = params?.constraintsOptions ?? {};
    const [root, components] = this.getGroupItBelongsTo(func.component);
    const degreeOfFreedom = components.reduce((prev, current) => {
      return prev + current.degreeOfFreedom;
    }, 0);
    const qCurrent = new Array<number>(degreeOfFreedom);
    components.forEach((c) => {
      if (c.col === -1) return;
      const state = c.saveState();
      qCurrent.splice(c.col, state.length, ...state);
    });
    try {
      const start = performance.now();
      const maxCnt = params?.maxCnt ?? 1000;
      const postProcess = params?.postProcess ?? true;
      const ignoreInequalityConstraints =
        params?.ignoreInequalityConstraints ?? true;
      const logOutput = params?.logOutput ?? false;
      const constraints = root.unionFindTreeConstraints;

      const dFx = new Array<number>(degreeOfFreedom).fill(0);
      const numInequalityConstraints = constraints.reduce(
        (prev, current) =>
          prev +
          (current.isInequalityConstraint && !ignoreInequalityConstraints
            ? 1
            : 0),
        0
      );
      if (numInequalityConstraints <= 1) {
        // 不等式制約が実質1つ以下 ⇒ 簡単に解ける
        const inequalityConstraint = constraints.find(
          (c) => c.isInequalityConstraint
        );
        let icBound = false;
        let hint: any;
        for (let j = 0; j < 2; ++j) {
          let minNorm = Number.MAX_SAFE_INTEGER;
          let equations = constraints.reduce((prev, current) => {
            current.row = prev;
            return prev + current.constraints(constraintsOptions);
          }, 0);
          if (inequalityConstraint && icBound) {
            inequalityConstraint.row = equations;
            ++equations;
            components.forEach((c) => {
              if (c.col === -1) return;
              c.restoreState(qCurrent.slice(c.col));
            });
          }
          const H = Matrix.eye(degreeOfFreedom, degreeOfFreedom); // ヘッセ行列
          // いつも同じところが更新されるので、毎回newしなくてもよい
          const phi_q = new Matrix(equations, degreeOfFreedom);
          const phi = new Array<number>(equations).fill(0);
          let lambda = Matrix.zeros(1, equations);
          const mat = new Matrix(
            degreeOfFreedom + equations,
            degreeOfFreedom + equations
          );
          // 目的関数の勾配を得る。
          func.getGradient(dFx);
          // ヤコビアンマトリックスと、現在の制約式を得る。
          constraints.forEach((constraint) => {
            constraint.setJacobianAndConstraints(
              phi_q,
              phi,
              constraintsOptions
            );
          });
          if (icBound) {
            hint = inequalityConstraint?.setJacobianAndConstraintsInequal(
              phi_q,
              phi,
              hint
            );
          }
          let i = 0;
          while (++i < maxCnt) {
            // ラグランジュ未定乗数法を解く。
            const matLambdaPhi = Matrix.columnVector([...dFx, ...phi]);
            mat.setSubMatrix(H, 0, 0);
            mat.setSubMatrix(phi_q, degreeOfFreedom, 0);
            mat.setSubMatrix(phi_q.transpose().mul(-1), 0, degreeOfFreedom);

            const dqAndLambda = new SingularValueDecomposition(mat, {
              autoTranspose: true
            }).solve(matLambdaPhi);

            // 一般化座標の差分を取得。
            const dq = dqAndLambda.subMatrix(0, degreeOfFreedom - 1, 0, 0);
            // 差分を反映
            components.forEach((component) => component.applyDq(dq));
            /* λn+1を計算
            const lambda = dqAndLambda
              .subMatrix(degreeOfFreedom, degreeOfFreedom + equations - 1, 0, 0)
              .transpose();
              */

            // 目的関数の勾配を得る。
            // ΔLを計算
            const deltaL = Matrix.rowVector(dFx);
            deltaL.add(lambda.mmul(phi_q));
            // 終了処理
            const norm1 = dq.norm('frobenius');
            const norm2 = deltaL.norm('frobenius');
            if (norm1 < 1.0e-3 && norm2 < 1e-3) break;
            const norm = norm1 + norm2;

            // ΦqとΦとdFxを更新。
            constraints.forEach((constraint) => {
              constraint.setJacobianAndConstraints(
                phi_q,
                phi,
                constraintsOptions
              );
            });
            if (icBound) {
              hint = inequalityConstraint?.setJacobianAndConstraintsInequal(
                phi_q,
                phi,
                hint
              );
            }
            func.getGradient(dFx);
            // ΔLn+1を計算
            const deltaLN1 = Matrix.rowVector(dFx);
            deltaLN1.add(lambda.mmul(phi_q));
            // λn+1を計算
            lambda = dqAndLambda
              .subMatrix(degreeOfFreedom, degreeOfFreedom + equations - 1, 0, 0)
              .transpose();

            // ヘッセ行列を更新
            const s = dq.clone().mul(-1);
            const y = deltaLN1.sub(deltaL);
            const Hs = H.mmul(s);
            const sy = s.dot(y);
            const sHs = s.dot(Hs);
            let HConverged = true;
            if (Math.abs(sHs) > Number.EPSILON) {
              const HssH = Hs.mmul(Hs.transpose().mul(-1 / sHs));
              H.add(HssH);
              HConverged = false;
            } else if (logOutput) {
              // eslint-disable-next-line no-console
              console.log('sHsの分母が0なのでヘッセ行列の更新ができなかった');
            }

            if (Math.abs(sy) > Number.EPSILON) {
              const yy = y.transpose().mmul(y.clone().mul(1 / sy));
              H.add(yy);
              HConverged = false;
            } else if (logOutput) {
              // eslint-disable-next-line no-console
              console.log('syの分母が0なのでヘッセ行列の更新ができなかった');
            }
            if (HConverged) break;

            // 収束確認
            if (logOutput) {
              // eslint-disable-next-line no-console
              console.log(
                `norm=${norm.toFixed(3)}\nnorm1 = ${norm1.toFixed(
                  3
                )}\nnorm2=${norm2.toFixed(3)}`
              );
            }
            if (norm > minNorm * 1000 || Number.isNaN(norm)) {
              // eslint-disable-next-line no-console
              if (logOutput) console.log('収束していない');
              throw new Error('準ニュートンラプソン法収束エラー');
            }
            if (norm < minNorm) {
              minNorm = norm;
            }
          }
          if (i >= maxCnt) {
            // eslint-disable-next-line no-console
            console.log('maxCntに到達');
            throw new Error('準ニュートンラプソン法収束エラー');
          }
          // 不等式制約を満足しているか確認。falseなら満足している。
          if (inequalityConstraint) {
            [icBound, hint] = inequalityConstraint.checkInequalityConstraint();
          }
          if (!icBound) break;
          if (logOutput) {
            // eslint-disable-next-line no-console
            console.log(
              `solver converged...\nbut inequal constraints are not satisfied.`
            );
          }
        }
      } else {
        throw new Error('未実装');
      }
      if (logOutput) {
        const end = performance.now();
        // eslint-disable-next-line no-console
        console.log(`solver converged...\ntime = ${(end - start).toFixed(1)}`);
      }
      if (postProcess) {
        this.postProcess();
      }
    } catch (e) {
      components.forEach((c) => {
        if (c.col === -1) return;
        c.restoreState(qCurrent.slice(c.col));
      });
      this.running = false;
      throw e;
    }
    this.running = false;
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
      }, {} as {[index: string]: number[]})
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
  }

  // ポストプロセス： 要素への位置の反映と、Restorerの適用
  postProcess(): void {
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
  }
}

export function isKinematicsSolver(
  solver: ISolver
): solver is KinematicsSolver {
  return solver.className === KinematicsSolver.className;
}
