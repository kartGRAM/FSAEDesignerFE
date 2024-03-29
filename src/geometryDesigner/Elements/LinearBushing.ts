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
  INamedNumber,
  INamedNumberRO,
  IDataNumber,
  IDataVector3,
  INamedVector3,
  INamedVector3RO,
  FunctionVector3
} from '@gd/INamedValues';
import {OBB} from '@gd/OBB';
import {IOBB} from '@gd/IOBB';

import {AtLeast1} from '@app/utils/atLeast';
import {v4 as uuidv4} from 'uuid';
import {minus} from '@app/utils/helpers';
import {
  isDataElement,
  MirrorError,
  Elements,
  NodeID,
  assignMeta,
  isMirror
} from '../IElements';
import {
  ILinearBushing,
  IDataLinearBushing,
  isLinearBushing,
  className
} from '../IElements/ILinearBushing';
import {Element, mirrorVec} from './ElementBase';

export class LinearBushing extends Element implements ILinearBushing {
  // eslint-disable-next-line class-methods-use-this
  get className(): Elements {
    return className;
  }

  unit = 'mm' as const;

  controllable = true as const;

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  initialPosition: NamedVector3;

  position: NamedVector3LW;

  rotation: NamedQuaternion;

  fixedPoints: [NamedVector3, NamedVector3];

  toPoints: AtLeast1<NamedNumber>;

  dlMin: NamedNumber;

  dlMax: NamedNumber;

  dlCurrent: number = 0;

  dlCurrentNodeID: NodeID;

  obb: IOBB;

  getOBB() {
    return new OBB().setFromVertices(
      this.getPoints()
        .filter((n) => !n.meta.isFreeNode || n.meta.enclosed)
        .map((n) => n.value)
    );
  }

  get currentPoints() {
    const fp = this.fixedPoints.map((p) => p.value);
    const toP = this.toPoints.map((to) => to.value);
    const center = fp[0].clone().add(fp[1]).multiplyScalar(0.5);
    const dir = fp[1].clone().sub(fp[0]).normalize();
    return toP.map((to) =>
      center.clone().add(dir.clone().multiplyScalar(to + this.dlCurrent))
    );
  }

  get isLimited() {
    return (
      Math.abs(this.dlCurrent - this.dlMin.value) < 1e-5 ||
      Math.abs(this.dlCurrent - this.dlMax.value) < 1e-5
    );
  }

  get points(): INamedVector3[] {
    const fp = this.fixedPoints.map((p) => p.value);
    const center = fp[0].clone().add(fp[1]).multiplyScalar(0.5);
    const dir = fp[1].clone().sub(fp[0]).normalize();
    const points = this.toPoints.map(
      (to, i) =>
        new NamedVector3({
          name: `rodEnd${i}`,
          parent: this,
          value: center.clone().add(dir.clone().multiplyScalar(to.value)),
          update: () => {},
          nodeID: `${to.nodeID}_points`
        })
    );
    return points;
  }

  getMeasurablePoints(): INamedVector3RO[] {
    const fp = this.fixedPoints.map((p) => p.value);
    const center = fp[0].clone().add(fp[1]).multiplyScalar(0.5);
    const dir = fp[1].clone().sub(fp[0]).normalize();
    const points = this.toPoints
      .map((to, i) => [
        new NamedVector3({
          name: `rodEnd${i}`,
          parent: this,
          value: center
            .clone()
            .add(dir.clone().multiplyScalar(to.value + this.dlCurrent)),
          update: () => {},
          nodeID: `${to.nodeID}_points`
        }),
        new NamedVector3({
          name: `rodEnd${i}_initialPosition`,
          parent: this,
          value: center.clone().add(dir.clone().multiplyScalar(to.value)),
          update: () => {},
          nodeID: `${to.nodeID}_points_initial`
        })
      ])
      .flat();
    return [
      ...this.fixedPoints,
      ...points,
      this.centerOfGravity,
      this.position
    ];
  }

  get supportDistance(): number {
    const fp = this.fixedPoints.map((p) => p.value);
    return fp[1].clone().sub(fp[0]).length();
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
    const points = [...this.fixedPoints];
    if (points.length === 0) return;
    this.centerOfGravity.value = points
      .filter((p) => !p.meta.isFreeNode || p.meta.enclosed)
      .reduce((prev, current) => {
        prev.add(current.value);
        return prev;
      }, new Vector3())
      .multiplyScalar(1 / points.length);
  }

  getVariables(): INamedNumberRO[] {
    const vars = super.getVariables();
    const dlCurrent = new NamedNumber({
      name: 'dlCurrent',
      parent: this,
      value: this.dlCurrent,
      update: () => {},
      nodeID: this.dlCurrentNodeID
    });
    return [...vars, dlCurrent];
  }

  arrange(parentPosition?: Vector3) {
    this.dlCurrent = 0;
    const pp = parentPosition ?? new Vector3();
    this.position.value = this.initialPosition.value.clone().add(pp);
    this.rotation.value = new Quaternion();
  }

  getMirror(): LinearBushing {
    if (isMirror(this)) throw new MirrorError('ミラーはミラーできない');
    const fp: [INamedVector3, INamedVector3] = [
      mirrorVec(this.fixedPoints[0]),
      mirrorVec(this.fixedPoints[1])
    ];
    const toPoints = this.toPoints.map((p) => minus(p.getStringValue()));
    const ip = mirrorVec(this.initialPosition);
    const cog = mirrorVec(this.centerOfGravity);
    const toPoint0 = toPoints.shift()!;
    const ret = new LinearBushing({
      name: `mirror_${this.name.value}`,
      fixedPoints: fp,
      toPoints: [toPoint0, ...toPoints],
      dlMin: this.dlMin.value,
      dlMax: this.dlMax.value,
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

  fixedPointNames = ['support1', 'support2'];

  pointName = 'rodEnd';

  constructor(
    params:
      | {
          name: string;
          fixedPoints: [
            FunctionVector3 | IDataVector3 | INamedVector3,
            FunctionVector3 | IDataVector3 | INamedVector3
          ];
          toPoints: AtLeast1<number | string | IDataNumber | INamedNumber>;
          dlMin: number;
          dlMax: number;
          dlCurrentNodeID?: NodeID;
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3 | IDataVector3 | INamedVector3;
          autoCalculateCenterOfGravity?: boolean;
        }
      | IDataLinearBushing
  ) {
    super(params);

    const {
      fixedPoints,
      toPoints,
      initialPosition,
      mass,
      centerOfGravity,
      dlCurrentNodeID
    } = params;
    this.dlCurrentNodeID = dlCurrentNodeID ?? uuidv4();

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
    const p = [...toPoints];
    const point0 = p.shift()!;
    this.toPoints = [
      new NamedNumber({
        name: `${this.pointName}1`,
        parent: this,
        value: point0
      }),
      ...p.map(
        (point, i) =>
          new NamedNumber({
            name: `${this.pointName}${i + 1}`,
            parent: this,
            value: point
          })
      )
    ];

    this.dlMin = new NamedNumber({
      name: 'dlMin',
      parent: this,
      value: params.dlMin
    });
    this.dlMax = new NamedNumber({
      name: 'dlMax',
      parent: this,
      value: params.dlMax
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

  getDataElement(): IDataLinearBushing {
    const original = this.syncMirror();
    const baseData = super.getDataElementBase(original);
    const {dlCurrentNodeID} = this;
    return {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => point.getData()),
      toPoints: this.toPoints.map((to) => to.getData()),
      dlCurrentNodeID,
      dlMin: this.dlMin.getData(),
      dlMax: this.dlMax.getData()
    };
  }

  syncMirror() {
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const original = this.getAnotherElement(mirror);
    if (!original || !isLinearBushing(original)) return null;
    this.fixedPoints[0].setValue(mirrorVec(original.fixedPoints[0]));
    this.fixedPoints[1].setValue(mirrorVec(original.fixedPoints[1]));
    return original;
  }
}
