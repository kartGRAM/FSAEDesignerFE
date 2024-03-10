import {Vector3, Quaternion} from 'three';
// import * as THREE from 'three';
import {
  NamedVector3,
  NamedVector3LW,
  NamedMatrix3,
  NamedQuaternion,
  NamedNumber,
  NamedBooleanOrUndefined
} from '@gd/NamedValues';
import {
  IDataVector3,
  INamedVector3,
  INamedVector3RO,
  FunctionVector3
} from '@gd/INamedValues';
// import {minus} from '@app/utils/helpers';
import {OBB} from '@gd/OBB';
import {IOBB} from '@gd/IOBB';
import {range} from '@utils/helpers';
import {
  isDataElement,
  MirrorError,
  Elements,
  assignMeta,
  isMirror
} from '../IElements';
import {isTire, ITire, IDataTire, className} from '../IElements/ITire';
import {Element, mirrorVec} from './ElementBase';

export class Tire extends Element implements ITire {
  // eslint-disable-next-line class-methods-use-this
  get className(): Elements {
    return className;
  }

  hasNearestNeighborToPlane = true as const;

  getNearestNeighborToPlane(normal: Vector3): Vector3 {
    const n = normal.clone().normalize();
    // タイヤの軸の方向ベクトル
    const axis = this.tireAxis.value.clone().normalize();
    // 平面に平行なベクトル...②
    const g = axis.clone().cross(n).normalize();
    const r = this.radius;

    // ②を軸にaxisを90度回転した単位ベクトルに、半径をかけた点が最近傍点
    const q = new Quaternion().setFromAxisAngle(g, -Math.PI / 2);
    const p = (
      g.lengthSq() < Number.EPSILON * 2 ** 8
        ? new Vector3(0, 0, -1)
        : axis.applyQuaternion(q)
    ).multiplyScalar(r);
    return p.add(this.tireCenter.value);
  }

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  tireCenter: NamedVector3;

  tireAxis: NamedVector3;

  toInnerBearing: NamedNumber;

  toOuterBearing: NamedNumber;

  initialPosition: NamedVector3;

  tread: NamedNumber;

  position: NamedVector3LW;

  get radius(): number {
    return this.tireCenter.value.z;
  }

  rotation: NamedQuaternion;

  /* UpdateMethodが適当。直す必要あり */
  get outerBearing(): NamedVector3LW {
    const axis = this.tireAxis.value.clone().normalize();
    return new NamedVector3LW({
      name: 'OuterBaring',
      parent: this,
      value: this.tireCenter.originalValue.add(
        axis.multiplyScalar(this.toOuterBearing.value)
      ),
      nodeID: `${this.nodeID}leftBRG`
    });
  }

  /* 直す必要あり */
  get innerBearing(): NamedVector3LW {
    const axis = this.tireAxis.value.clone().normalize();
    return new NamedVector3LW({
      name: 'InnerBaring',
      parent: this,
      value: this.tireCenter.originalValue.add(
        axis.multiplyScalar(this.toInnerBearing.value)
      ),
      nodeID: `${this.nodeID}rightBRG`
    });
  }

  get bearingDistance(): number {
    return Math.abs(this.toOuterBearing.value - this.toInnerBearing.value);
  }

  getPoints(): INamedVector3RO[] {
    return [this.outerBearing, this.innerBearing];
  }

  // eslint-disable-next-line class-methods-use-this
  getForceResults(): {
    name: string;
    point: Vector3;
    force: Vector3;
    nodeID: string;
  }[] {
    const ground = this.getNearestNeighborToPlane(
      new Vector3(0, 0, 1).applyQuaternion(this.rotation.value.invert())
    );
    return [
      {
        name: 'centrifugal force',
        point: this.centerOfGravity.value,
        force: this.centrifugalForce,
        nodeID: `${this.centerOfGravity.nodeID}c`
      },
      {
        name: 'gravity',
        point: this.centerOfGravity.value,
        nodeID: `${this.centerOfGravity.nodeID}g`,
        force: this.gravity
      },
      {
        name: 'longitudinal force (fx)',
        point: ground,
        nodeID: 'ground x',
        force: this.fx
      },
      {
        name: 'lateral force (fy)',
        point: ground,
        nodeID: 'ground y',
        force: this.fy
      },
      {
        name: 'normal load (fz)',
        point: ground,
        nodeID: 'ground z',
        force: this.fz
      },
      {
        name: 'inner bearing force',
        point: this.innerBearing.value,
        nodeID: this.innerBearing.nodeID,
        force: this.innerBearingForce
      },
      {
        name: 'outer bearing force',
        point: this.outerBearing.value,
        nodeID: this.outerBearing.nodeID,
        force: this.outerBearingForce
      }
    ];
  }

  centrifugalForce: Vector3 = new Vector3();

  gravity: Vector3 = new Vector3();

  fy: Vector3 = new Vector3();

  fx: Vector3 = new Vector3();

  fz: Vector3 = new Vector3();

  innerBearingForce = new Vector3();

  outerBearingForce = new Vector3();

  angularVelocity = 0;

  obb: IOBB;

  getOBB() {
    const center = this.tireCenter.value;
    const points = [...this.getPoints().map((p) => p.value), center];

    const normal = new Vector3(0, 0, 1).applyQuaternion(this.rotation.value);
    const gPoint = this.getNearestNeighborToPlane(normal);
    const tread = this.tread.value;
    const axis = this.tireAxis.value.normalize();
    const halfTread = axis.clone().multiplyScalar(tread / 2);
    const p = gPoint.clone().sub(center);

    const segments = 16;
    const q = new Quaternion().setFromAxisAngle(axis, (2 * Math.PI) / segments);
    range(0, segments).forEach(() => {
      points.push(center.clone().add(p).add(halfTread));
      points.push(center.clone().add(p).sub(halfTread));
      p.applyQuaternion(q);
    });
    const q2 = new Quaternion().setFromAxisAngle(axis, (2 * Math.PI) / 4);
    const p2 = p.clone().applyQuaternion(q2);
    points.push(center.clone().add(p).add(p2));
    points.push(center.clone().add(p).sub(p2));
    points.push(center.clone().sub(p).add(p2));
    points.push(center.clone().sub(p).sub(p2));

    return new OBB().setFromVertices(points);
  }

  setCenterOfGravityAuto() {
    this.centerOfGravity.value = this.tireCenter.value;
  }

  getMeasurablePoints(): INamedVector3RO[] {
    const points = super.getMeasurablePoints();
    // タイヤの軸線
    const normal = new Vector3(0, 0, 1).applyQuaternion(this.rotation.value);
    const gPoint = this.getNearestNeighborToPlane(normal);
    const gPointNamed = new NamedVector3({
      name: 'groundingPoint',
      parent: this,
      value: gPoint,
      update: () => {},
      nodeID: `${this.nodeID}groundPoint`
    });

    return [...points, this.tireCenter, gPointNamed];
  }

  getPointsNodeIDs(): string[] {
    return [`${this.nodeID}leftBRG`, `${this.nodeID}rightBRG`];
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
    this.rotation.value = new Quaternion();
    this.angularVelocity = 0;
    this.centrifugalForce = new Vector3();
    this.gravity = new Vector3();
    this.fy = new Vector3();
    this.fx = new Vector3();
    this.fz = new Vector3();
    this.innerBearingForce = new Vector3();
    this.outerBearingForce = new Vector3();
  }

  getMirror(): Tire {
    if (isMirror(this)) throw new MirrorError('ミラーはミラーできない');
    const center = mirrorVec(this.tireCenter);
    const ip = mirrorVec(this.initialPosition);
    const cog = mirrorVec(this.centerOfGravity);
    const ret = new Tire({
      name: `mirror_${this.name.value}`,
      tireCenter: center,
      tread: this.tread.getStringValue(),
      tireAxis: mirrorVec(this.tireAxis),
      toOuterBearing: this.toOuterBearing.getStringValue(),
      toInnerBearing: this.toInnerBearing.getStringValue(),
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog,
      autoCalculateCenterOfGravity: this.autoCalculateCenterOfGravity.value
    });
    assignMeta(ret, {mirror: {to: this.nodeID}});
    return ret;
  }

  get diameter(): number {
    return this.tireCenter.value.z * 2.0;
  }

  get inertialTensor(): NamedMatrix3 {
    return new NamedMatrix3({name: 'inertialTensor', parent: this});
  }

  // eslint-disable-next-line class-methods-use-this
  set inertialTensor(mat: NamedMatrix3) {
    // throw Error('Not Supported Exception');
  }

  constructor(
    params:
      | {
          name: string;
          tireCenter: FunctionVector3 | IDataVector3 | INamedVector3;
          tread?: number | string;
          tireAxis?: FunctionVector3 | IDataVector3 | INamedVector3;
          toOuterBearing: number | string;
          toInnerBearing: number | string;
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3 | IDataVector3 | INamedVector3;
          autoCalculateCenterOfGravity?: boolean;
        }
      | IDataTire
  ) {
    super(params);
    const {
      tireCenter,
      tireAxis,
      initialPosition,
      mass,
      centerOfGravity,
      tread
    } = params;

    this.tireCenter = new NamedVector3({
      name: 'tireCenter',
      parent: this,
      value: tireCenter ?? new Vector3()
    });
    this.tread = new NamedNumber({
      name: 'tread',
      parent: this,
      value: tread ?? 175
    });

    this.tireAxis = new NamedVector3({
      name: 'tireAxis',
      parent: this,
      value: tireAxis ?? new Vector3(0, 1, 0)
    });

    this.toOuterBearing = new NamedNumber({
      name: 'toOuterBearing',
      parent: this,
      value: isDataElement(params)
        ? params.toLeftBearing
        : params.toOuterBearing
    });
    this.toInnerBearing = new NamedNumber({
      name: 'toInnerBearing',
      parent: this,
      value: isDataElement(params)
        ? params.toRightBearing
        : params.toInnerBearing
    });

    this.visible = new NamedBooleanOrUndefined({
      name: 'visible',
      parent: this,
      value: isDataElement(params) ? params.visible : true
    });
    this.initialPosition = new NamedVector3({
      name: 'initialPosition',
      parent: this,
      value: initialPosition ?? new Vector3()
    });
    this.mass = new NamedNumber({
      name: 'mass',
      parent: this,
      value: mass ?? 0.001
    });
    this.centerOfGravity = new NamedVector3({
      name: 'centerOfGravity',
      parent: this,
      value: centerOfGravity ?? new Vector3(),
      nodeID: `${this.nodeID}cog`
    });
    this.position = new NamedVector3LW({
      name: 'position',
      parent: this,
      value: isDataElement(params)
        ? params.position
        : this.initialPosition.value
    });
    this.rotation = new NamedQuaternion({
      name: 'rotation',
      parent: this,
      value: isDataElement(params) ? params.rotation : new Quaternion()
    });
    this.obb = this.getOBB();
  }

  getDataElement(): IDataTire {
    const original = this.syncMirror();
    const baseData = super.getDataElementBase(original);
    return {
      ...baseData,
      tireCenter: this.tireCenter.getData(),
      tread: this.tread.getData(),
      tireAxis: this.tireAxis.getData(),
      toLeftBearing: this.toOuterBearing.getData(),
      toRightBearing: this.toInnerBearing.getData()
    };
  }

  syncMirror() {
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const original = this.getAnotherElement(mirror);
    if (!original || !isTire(original)) return null;
    this.tireCenter.setValue(mirrorVec(original.tireCenter));
    this.tread.setValue(original.tread.getStringValue());
    this.tireAxis.setValue(mirrorVec(original.tireAxis));
    this.toOuterBearing.setValue(original.toOuterBearing.getStringValue());
    this.toInnerBearing.setValue(original.toInnerBearing.getStringValue());
    return original;
  }
}
