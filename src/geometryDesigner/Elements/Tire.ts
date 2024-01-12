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
import {minus} from '@app/utils/helpers';
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
    const axis = new Vector3(0, 1, 0);
    // 平面に平行なベクトル...②
    const g = axis.clone().cross(n);
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

  toLeftBearing: NamedNumber;

  toRightBearing: NamedNumber;

  initialPosition: NamedVector3;

  position: NamedVector3LW;

  get radius(): number {
    return this.tireCenter.value.z;
  }

  rotation: NamedQuaternion;

  /* UpdateMethodが適当。直す必要あり */
  get leftBearing(): NamedVector3LW {
    return new NamedVector3LW({
      name: 'leftBaring',
      parent: this,
      value: this.tireCenter.originalValue.add(
        new Vector3(0, this.toLeftBearing.value, 0)
      ),
      nodeID: `${this.nodeID}leftBRG`
    });
  }

  /* 直す必要あり */
  get rightBearing(): NamedVector3LW {
    return new NamedVector3LW({
      name: 'rightBaring',
      parent: this,
      value: this.tireCenter.originalValue.add(
        new Vector3(0, this.toRightBearing.value, 0)
      ),
      nodeID: `${this.nodeID}rightBRG`
    });
  }

  get bearingDistance(): number {
    return Math.abs(this.toLeftBearing.value - this.toRightBearing.value);
  }

  getPoints(): INamedVector3RO[] {
    return [this.leftBearing, this.rightBearing];
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

    return [...points, gPointNamed];
  }

  getPointsNodeIDs(): string[] {
    return [`${this.nodeID}leftBRG`, `${this.nodeID}rightBRG`];
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
    this.rotation.value = new Quaternion();
  }

  getMirror(): Tire {
    if (isMirror(this)) throw new MirrorError('ミラーはミラーできない');
    const center = mirrorVec(this.tireCenter);
    const ip = mirrorVec(this.initialPosition);
    const cog = mirrorVec(this.centerOfGravity);
    const ret = new Tire({
      name: `mirror_${this.name.value}`,
      tireCenter: center,
      toLeftBearing: minus(this.toRightBearing.getStringValue()),
      toRightBearing: minus(this.toLeftBearing.getStringValue()),
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
          toLeftBearing: number | string;
          toRightBearing: number | string;
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
      toLeftBearing,
      toRightBearing,
      initialPosition,
      mass,
      centerOfGravity
    } = params;

    this.tireCenter = new NamedVector3({
      name: 'tireCenter',
      parent: this,
      value: tireCenter ?? new Vector3()
    });

    this.toLeftBearing = new NamedNumber({
      name: 'toLeftBearing',
      parent: this,
      value: toLeftBearing
    });
    this.toRightBearing = new NamedNumber({
      name: 'toRightBearing',
      parent: this,
      value: toRightBearing
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
  }

  getDataElement(): IDataTire {
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const mir = this.getAnotherElement(mirror);
    const baseData = super.getDataElementBase(mir);

    if (mir && isTire(mir)) {
      return {
        ...baseData,
        tireCenter: this.tireCenter
          .setValue(mirrorVec(mir.tireCenter))
          .getData(),
        toLeftBearing: this.toLeftBearing
          .setValue(minus(mir.toLeftBearing.getStringValue()))
          .getData(),
        toRightBearing: this.toRightBearing
          .setValue(minus(mir.toRightBearing.getStringValue()))
          .getData()
      };
    }
    return {
      ...baseData,
      tireCenter: this.tireCenter.getData(),
      toLeftBearing: this.toLeftBearing.getData(),
      toRightBearing: this.toRightBearing.getData()
    };
  }
}
