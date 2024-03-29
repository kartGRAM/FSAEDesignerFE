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
import {AtLeast2} from '@app/utils/atLeast';
import {OBB} from '@gd/OBB';
import {IOBB} from '@gd/IOBB';
import {
  isDataElement,
  MirrorError,
  Elements,
  assignMeta,
  isMirror
} from '../IElements';
import {
  isBellCrank,
  IBellCrank,
  IDataBellCrank,
  className
} from '../IElements/IBellCrank';
import {Element, mirrorVec, syncPointsMirror} from './ElementBase';

export class BellCrank extends Element implements IBellCrank {
  // eslint-disable-next-line class-methods-use-this
  get className(): Elements {
    return className;
  }

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  fixedPoints: [NamedVector3, NamedVector3];

  points: AtLeast2<NamedVector3>;

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
    return [];
  }

  setCenterOfGravityAuto() {
    const points = [...this.fixedPoints, this.points[0], this.points[1]];
    this.centerOfGravity.value = points
      .filter((p) => !p.meta.isFreeNode || p.meta.enclosed)
      .reduce((prev, current) => {
        prev.add(current.value);
        return prev;
      }, new Vector3())
      .multiplyScalar(0.25);
  }

  get centerOfPoints() {
    const {fixedPoints, points} = this;
    return new NamedVector3({
      name: 'center',
      parent: this,
      value: fixedPoints[0].value
        .add(fixedPoints[1].value)
        .add(points[0].value)
        .add(points[1].value)
        .multiplyScalar(0.25)
    });
  }

  arrange(parentPosition?: Vector3) {
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
    this.rotation.value = new Quaternion();
  }

  getMirror(): BellCrank {
    if (isMirror(this)) throw new MirrorError('ミラーはミラーできない');
    const fp: [INamedVector3, INamedVector3] = [
      mirrorVec(this.fixedPoints[0]),
      mirrorVec(this.fixedPoints[1])
    ];
    const points = this.points.map((p) => mirrorVec(p));
    const point0 = points.shift()!;
    const point1 = points.shift()!;
    const ip = mirrorVec(this.initialPosition);
    const cog = mirrorVec(this.centerOfGravity);
    const ret = new BellCrank({
      name: `mirror_${this.name.value}`,
      fixedPoints: fp,
      points: [point0, point1, ...points],
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

  fixedPointNames = ['pivot1', 'pivot2'];

  pointNames = ['coilover', 'rod', 'attachment'];

  constructor(
    params:
      | {
          name: string;
          fixedPoints: [
            FunctionVector3 | IDataVector3 | INamedVector3,
            FunctionVector3 | IDataVector3 | INamedVector3
          ];
          points: AtLeast2<FunctionVector3 | IDataVector3 | INamedVector3>;
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3 | IDataVector3 | INamedVector3;
          autoCalculateCenterOfGravity?: boolean;
        }
      | IDataBellCrank
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
    const point1 = p.shift()!;
    this.points = [
      new NamedVector3({
        name: this.pointNames[0],
        parent: this,
        value: point0
      }),
      new NamedVector3({
        name: this.pointNames[1],
        parent: this,
        value: point1
      }),
      ...p.map(
        (point, i) =>
          new NamedVector3({
            name: `${this.pointNames[2]}${i + 1}`,
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

  getDataElement(): IDataBellCrank {
    const original = this.syncMirror();
    const baseData = super.getDataElementBase(original);

    return {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => point.getData()),
      points: this.points.map((point) => point.getData())
    };
  }

  syncMirror() {
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const original = this.getAnotherElement(mirror);
    if (!original || !isBellCrank(original)) return null;
    this.fixedPoints[0].setValue(mirrorVec(original.fixedPoints[0]));
    this.fixedPoints[1].setValue(mirrorVec(original.fixedPoints[1]));
    this.points = syncPointsMirror(this.points, original.points) as any;
    return original;
  }
}
