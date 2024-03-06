import {Vector3, Quaternion} from 'three';
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
import {OBB} from '@gd/OBB';
import {IOBB} from '@gd/IOBB';
import {
  isDataElement,
  MirrorError,
  Elements,
  assignMeta,
  isMirror
} from '../IElements';
import {isBar, IBar, IDataBar, className} from '../IElements/IBar';
import {Element, mirrorVec} from './ElementBase';

export class Bar extends Element implements IBar {
  // eslint-disable-next-line class-methods-use-this
  get className(): Elements {
    return className;
  }

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  fixedPoint: NamedVector3;

  point: NamedVector3;

  initialPosition: NamedVector3;

  position: NamedVector3LW;

  rotation: NamedQuaternion;

  obb: IOBB;

  getOBB() {
    return new OBB().setFromVertices(
      this.getPoints()
        .filter((n) => !n.meta.isFreeNode || n.meta.enclosed)
        .map((n) => n.value)
    );
  }

  get length(): number {
    return this.fixedPoint.value.sub(this.point.value).length();
  }

  getPoints(): INamedVector3RO[] {
    return [this.fixedPoint, this.point];
  }

  getForceResults(): {
    name: string;
    point: Vector3;
    force: Vector3;
    nodeID: string;
  }[] {
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
        name: 'force1',
        point: this.fixedPoint.value,
        nodeID: this.fixedPoint.nodeID,
        force: this.fixedPointForce
      },
      {
        name: 'force2',
        point: this.point.value,
        nodeID: this.point.nodeID,
        force: this.pointForce
      }
    ];
  }

  centrifugalForce: Vector3 = new Vector3();

  gravity: Vector3 = new Vector3();

  fixedPointForce: Vector3 = new Vector3();

  pointForce: Vector3 = new Vector3();

  setCenterOfGravityAuto() {
    const points = [this.fixedPoint, this.point];
    this.centerOfGravity.value = points
      .reduce((prev, current) => {
        prev.add(current.value);
        return prev;
      }, new Vector3())
      .multiplyScalar(0.5);
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
    this.rotation.value = new Quaternion();
  }

  getMirror(): Bar {
    if (isMirror(this)) throw new MirrorError('ミラーはミラーできない');
    const fp = mirrorVec(this.fixedPoint);
    const p = mirrorVec(this.point);
    const ip = mirrorVec(this.initialPosition);
    const cog = mirrorVec(this.centerOfGravity);
    const ret = new Bar({
      name: `mirror_${this.name.value}`,
      fixedPoint: fp,
      point: p,
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
          fixedPoint: FunctionVector3 | IDataVector3 | INamedVector3;
          point: FunctionVector3 | IDataVector3 | INamedVector3;
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3 | IDataVector3 | INamedVector3;
          autoCalculateCenterOfGravity?: boolean;
        }
      | IDataBar
  ) {
    super(params);
    const {fixedPoint, point, initialPosition, mass, centerOfGravity} = params;

    this.fixedPoint = new NamedVector3({
      name: 'fixedPoint',
      parent: this,
      value: fixedPoint
    });
    this.point = new NamedVector3({
      name: 'point',
      parent: this,
      value: point
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

  getDataElement(): IDataBar {
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const mir = this.getAnotherElement(mirror);
    const baseData = super.getDataElementBase(mir);

    if (mir && isBar(mir)) {
      return {
        ...baseData,
        fixedPoint: this.fixedPoint
          .setValue(mirrorVec(mir.fixedPoint))
          .getData(),
        point: this.point.setValue(mirrorVec(mir.point)).getData()
      };
    }
    return {
      ...baseData,
      fixedPoint: this.fixedPoint.getData(),
      point: this.point.getData()
    };
  }
}
