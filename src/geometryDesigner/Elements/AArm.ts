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
import {IDataVector3, INamedVector3, FunctionVector3} from '@gd/INamedValues';
import {AtLeast1} from '@app/utils/atLeast';
import {OBB} from '@gd/OBB';
import {IOBB} from '@gd/IOBB';
import {
  isDataElement,
  MirrorError,
  Elements,
  assignMeta,
  isMirror
} from '../IElements';
import {isAArm, IAArm, IDataAArm, className} from '../IElements/IAArm';
import {Element, mirrorVec, syncPointsMirror} from './ElementBase';

export class AArm extends Element implements IAArm {
  // eslint-disable-next-line class-methods-use-this
  get className(): Elements {
    return className;
  }

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  initialPosition: NamedVector3;

  position: NamedVector3LW;

  rotation: NamedQuaternion;

  fixedPoints: [NamedVector3, NamedVector3];

  points: AtLeast1<NamedVector3>;

  obb: IOBB;

  getOBB() {
    return new OBB().setFromVertices(
      this.getPoints()
        .filter((n) => !n.meta.isFreeNode || n.meta.enclosed)
        .map((n) => n.value)
    );
  }

  get centerOfPoints() {
    const {fixedPoints, points} = this;
    return new NamedVector3({
      name: 'center',
      parent: this,
      value: fixedPoints[0].value
        .add(fixedPoints[1].value)
        .add(points[0].value)
        .multiplyScalar(1 / 3)
    });
  }

  getPoints(): INamedVector3[] {
    return [...this.fixedPoints, ...this.points];
  }

  // eslint-disable-next-line class-methods-use-this
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
        nodeID: `${this.centerOfGravity.nodeID}c`,
        force: this.centrifugalForce ?? new Vector3()
      },
      {
        name: 'gravity',
        point: this.centerOfGravity.value,
        nodeID: `${this.centerOfGravity.nodeID}g`,
        force: this.gravity ?? new Vector3()
      },
      ...this.fixedPoints.map((p, i) => ({
        name: `force${i + 1}`,
        point: p.value,
        nodeID: p.nodeID,
        force: this.fixedPointForce[i] ?? new Vector3()
      })),
      ...this.points.map((p, i) => ({
        name: `force${i + 3}`,
        point: p.value,
        nodeID: p.nodeID,
        force: this.pointForce[i] ?? new Vector3()
      }))
    ];
  }

  centrifugalForce: Vector3 = new Vector3();

  gravity: Vector3 = new Vector3();

  fixedPointForce: Vector3[] = [];

  pointForce: Vector3[] = [];

  setCenterOfGravityAuto() {
    const points = [...this.fixedPoints, this.points[0]];
    this.centerOfGravity.value = points
      .reduce((prev, current) => {
        prev.add(current.value);
        return prev;
      }, new Vector3())
      .multiplyScalar(1 / 3);
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
    this.rotation.value = new Quaternion();
  }

  getMirror(): AArm {
    if (isMirror(this)) throw new MirrorError('ミラーはミラーできない');
    const fp: [INamedVector3, INamedVector3] = [
      mirrorVec(this.fixedPoints[0]),
      mirrorVec(this.fixedPoints[1])
    ];
    const points = this.points.map((p) => mirrorVec(p));
    const ip = mirrorVec(this.initialPosition);
    const cog = mirrorVec(this.centerOfGravity);
    const point0 = points.shift()!;
    const ret = new AArm({
      name: `mirror_${this.name.value}`,
      fixedPoints: fp,
      points: [point0, ...points],
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

  fixedPointNames = ['chassisFore', 'chassisAft'];

  pointNames = ['upright', 'attachedPoint'];

  constructor(
    params:
      | {
          name: string;
          fixedPoints: [
            FunctionVector3 | IDataVector3 | INamedVector3,
            FunctionVector3 | IDataVector3 | INamedVector3
          ];
          points: AtLeast1<FunctionVector3 | IDataVector3 | INamedVector3>;
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3 | IDataVector3 | INamedVector3;
          autoCalculateCenterOfGravity?: boolean;
        }
      | IDataAArm
  ) {
    super(params);
    const {fixedPoints, points, initialPosition, mass, centerOfGravity} =
      params;
    this.fixedPoints = [
      new NamedVector3({
        name: this.fixedPointNames[0],
        parent: this,
        value: fixedPoints[0]
      }),

      new NamedVector3({
        name: this.fixedPointNames[1],
        parent: this,
        value: fixedPoints[1]
      })
    ];
    const p = [...points];
    const point0 = p.shift()!;
    this.points = [
      new NamedVector3({
        name: this.pointNames[0],
        parent: this,
        value: point0
      }),
      ...p.map(
        (point, i) =>
          new NamedVector3({
            name: `${this.pointNames[1]}${i + 1}`,
            parent: this,
            value: point
          })
      )
    ];

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

  getDataElement(): IDataAArm {
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const mir = this.getAnotherElement(mirror);
    const baseData = super.getDataElementBase(mir);

    if (mir && isAArm(mir)) {
      return {
        ...baseData,
        fixedPoints: [
          this.fixedPoints[0].setValue(mirrorVec(mir.fixedPoints[0])).getData(),
          this.fixedPoints[1].setValue(mirrorVec(mir.fixedPoints[1])).getData()
        ],
        points: syncPointsMirror(this.points, mir.points)
      };
    }
    return {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => point.getData()),
      points: this.points.map((point) => point.getData())
    };
  }
}
