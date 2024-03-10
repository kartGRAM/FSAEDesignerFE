import {Vector3, Quaternion} from 'three';
import {OBB} from '@gd/OBB';
import {IOBB} from '@gd/IOBB';
import {
  NamedVector3,
  NamedVector3LW,
  NamedMatrix3,
  NamedQuaternion,
  NamedNumber,
  NamedBooleanOrUndefined
} from '@gd/NamedValues';
import {
  INamedNumberRO,
  IDataVector3,
  INamedVector3,
  INamedVector3RO,
  FunctionVector3
} from '@gd/INamedValues';

import {v4 as uuidv4} from 'uuid';
import {
  isDataElement,
  MirrorError,
  Elements,
  NodeID,
  assignMeta,
  isMirror
} from '../IElements';
import {Element, mirrorVec} from './ElementBase';
import {
  ITorsionSpring,
  IDataTorsionSpring,
  isTorsionSpring,
  className
} from '../IElements/ITorsionSpring';

export class TorsionSpring extends Element implements ITorsionSpring {
  // eslint-disable-next-line class-methods-use-this
  get className(): Elements {
    return className;
  }

  unit = 'deg' as const;

  controllable = false as const;

  visible: NamedBooleanOrUndefined;

  mass: NamedNumber;

  centerOfGravity: NamedVector3;

  k: NamedNumber; // N・m/deg

  initialPosition: NamedVector3;

  position: NamedVector3LW;

  rotation: NamedQuaternion;

  fixedPoints: [NamedVector3, NamedVector3];

  effortPoints: [NamedVector3, NamedVector3];

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

  get currentEffortPoints() {
    const fp = this.fixedPoints.map((p) => p.value);
    const axis = fp[1].clone().sub(fp[0]).normalize();

    const a = (this.dlCurrent * Math.PI) / 180;
    const q = new Quaternion().setFromAxisAngle(axis, a);

    const p = this.effortPoints.map((to) => to.value);
    const effortP = p[0].clone().sub(fp[0]).applyQuaternion(q).add(fp[0]);
    return [effortP, p[1]];
  }

  getMeasurablePoints(): INamedVector3RO[] {
    const effortP = this.currentEffortPoints;
    const points = [
      new NamedVector3({
        name: `rodEnd${0}`,
        parent: this,
        value: effortP[0],
        update: () => {},
        // nodeID: `${this.effortPoints[0].nodeID}`
        nodeID: `${this.effortPoints[0].nodeID}`
      }),
      new NamedVector3({
        name: `rodEnd${1}`,
        parent: this,
        value: effortP[1],
        update: () => {},
        // nodeID: `${this.effortPoints[1].nodeID}`
        nodeID: `${this.effortPoints[1].nodeID}`
      })
    ];
    return [
      ...this.fixedPoints,
      ...points,
      this.centerOfGravity,
      this.position
    ];
  }

  getPoints(): INamedVector3[] {
    return [...this.fixedPoints, ...this.effortPoints];
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

  getMirror(): TorsionSpring {
    if (isMirror(this)) throw new MirrorError('ミラーはミラーできない');
    const fp: [INamedVector3, INamedVector3] = [
      mirrorVec(this.fixedPoints[0]),
      mirrorVec(this.fixedPoints[1])
    ];
    const effortPoints = this.effortPoints.map((p) => mirrorVec(p));
    const ip = mirrorVec(this.initialPosition);
    const cog = mirrorVec(this.centerOfGravity);
    const ret = new TorsionSpring({
      name: `mirror_${this.name.value}`,
      fixedPoints: fp,
      effortPoints: [...effortPoints] as any,
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
          effortPoints: [
            FunctionVector3 | IDataVector3 | INamedVector3,
            FunctionVector3 | IDataVector3 | INamedVector3
          ];
          dlCurrentNodeID?: NodeID;
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3 | IDataVector3 | INamedVector3;
          autoCalculateCenterOfGravity?: boolean;
          k?: number;
        }
      | IDataTorsionSpring
  ) {
    super(params);

    const {
      fixedPoints,
      effortPoints,
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
    this.effortPoints = [
      ...effortPoints.map(
        (point, i) =>
          new NamedVector3({
            name: `${this.pointName}${i}`,
            parent: this,
            value: point
          })
      )
    ] as [NamedVector3, NamedVector3];

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
    this.k = new NamedNumber({
      name: 'springRate',
      parent: this,
      value: params.k ?? 5
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

  getDataElement(): IDataTorsionSpring {
    const original = this.syncMirror();
    const baseData = super.getDataElementBase(original);
    const {dlCurrentNodeID} = this;

    return {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => point.getData()),
      effortPoints: this.effortPoints.map((to) => to.getData()),
      k: this.k.getData(),
      dlCurrentNodeID
    };
  }

  syncMirror() {
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const original = this.getAnotherElement(mirror);
    if (!original || !isTorsionSpring(original)) return null;
    this.fixedPoints.forEach((p, i) =>
      p.setValue(mirrorVec(original.fixedPoints[i]))
    );
    this.effortPoints.forEach((p, i) =>
      p.setValue(mirrorVec(original.effortPoints[i]))
    );
    return original;
  }
}
