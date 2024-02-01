import {Vector3, Quaternion} from 'three';
import {
  NamedVector3,
  NamedVector3LW,
  NamedMatrix3,
  NamedQuaternion,
  NamedNumber,
  NamedBooleanOrUndefined
} from '@gd/NamedValues';
import {IDataVector3, INamedVector3, FunctionVector3} from '@gd/INamedValues';
import {
  isDataElement,
  isBodyOfFrame,
  MirrorError,
  Elements,
  assignMeta,
  isMirror
} from '../IElements';
import {isBody, IBody, IDataBody, className} from '../IElements/IBody';
import {Element, mirrorVec, syncPointsMirror} from './ElementBase';

export class Body extends Element implements IBody {
  // eslint-disable-next-line class-methods-use-this
  get className(): Elements {
    return className;
  }

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  fixedPoints: Array<NamedVector3>;

  points: Array<NamedVector3>;

  initialPosition: NamedVector3;

  position: NamedVector3LW;

  rotation: NamedQuaternion;

  getPoints(): INamedVector3[] {
    return [...this.fixedPoints, ...this.points];
  }

  // eslint-disable-next-line class-methods-use-this
  getForceResults(): {name: string; point: Vector3; result: Vector3}[] {
    return [];
  }

  setCenterOfGravityAuto() {
    const points = [...this.fixedPoints, ...this.points];
    if (points.length === 0) return;
    this.centerOfGravity.value = points
      .reduce((prev, current) => {
        prev.add(current.value);
        return prev;
      }, new Vector3())
      .multiplyScalar(1 / points.length);
  }

  get centerOfPoints() {
    const {fixedPoints, points} = this;
    const c = new Vector3();
    this.points.forEach((p) => c.add(p.value));
    this.fixedPoints.forEach((p) => c.add(p.value));
    if (points.length || fixedPoints.length) {
      c.multiplyScalar(1 / (points.length + fixedPoints.length));
    }

    return new NamedVector3({
      name: 'center',
      parent: this,
      value: c
    });
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
    this.rotation.value = new Quaternion();
  }

  getMirror(): Body {
    if (isMirror(this)) throw new MirrorError('ミラーはミラーできない');
    const fp = this.fixedPoints.map((p) => mirrorVec(p));
    const points = this.points.map((p) => mirrorVec(p));
    const ip = mirrorVec(this.initialPosition);
    const cog = mirrorVec(this.centerOfGravity);
    const ret = new Body({
      name: `mirror_${this.name.value}`,
      fixedPoints: fp,
      points,
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog,
      autoCalculateCenterOfGravity: this.autoCalculateCenterOfGravity.value
    });
    assignMeta(ret, {mirror: {to: this.nodeID}});
    return ret;
  }

  get inertialTensor(): NamedMatrix3 {
    return new NamedMatrix3({
      parent: this,
      name: 'inertialTensor'
    });
  }

  // eslint-disable-next-line class-methods-use-this
  set inertialTensor(mat: NamedMatrix3) {
    // throw Error('Not Supported Exception');
  }

  constructor(
    params:
      | {
          name: string;
          fixedPoints: Array<FunctionVector3 | IDataVector3 | INamedVector3>;
          points: Array<FunctionVector3 | IDataVector3 | INamedVector3>;
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3 | IDataVector3 | INamedVector3;
          autoCalculateCenterOfGravity?: boolean;
        }
      | IDataBody
  ) {
    super(params);
    const {fixedPoints, points, initialPosition, mass, centerOfGravity} =
      params;
    this.fixedPoints = fixedPoints.map(
      (point, i) =>
        new NamedVector3({
          name: `fixedPoint${i + 1}`,
          parent: this,
          value: point
        })
    );
    this.points = points.map(
      (point, i) =>
        new NamedVector3({
          name: `point${i + 1}`,
          parent: this,
          value: point
        })
    );

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

  getDataElement(): IDataBody {
    const bIsBodyOfFrame = isBodyOfFrame(this);
    if (bIsBodyOfFrame) {
      this.name.value = `bodyObject_${this.parent?.name.value}`;
    }
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const mir = this.getAnotherElement(mirror);
    const baseData = super.getDataElementBase(mir);

    if (mir && isBody(mir)) {
      return {
        ...baseData,
        fixedPoints: syncPointsMirror(this.fixedPoints, mir.fixedPoints),
        points: syncPointsMirror(this.points, mir.points),
        isBodyOfFrame: bIsBodyOfFrame
      };
    }
    return {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => point.getData()),
      points: this.points.map((point) => point.getData()),
      isBodyOfFrame: bIsBodyOfFrame
    };
  }
}
