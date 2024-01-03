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
  INamedNumberRO,
  IDataVector3,
  INamedVector3,
  INamedVector3RO,
  FunctionVector3
} from '@gd/INamedValues';

import {OneOrTwo} from '@app/utils/atLeast';
import {v4 as uuidv4} from 'uuid';
import {GDState} from '@store/reducers/dataGeometryDesigner';
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

  initialPosition: NamedVector3;

  position: NamedVector3LW;

  rotation: NamedQuaternion;

  fixedPoints: [NamedVector3, NamedVector3];

  effortPoints: OneOrTwo<NamedVector3>;

  dlCurrent: number = 0;

  dlCurrentNodeID: NodeID;

  get currentEffortPoints() {
    const fp = this.fixedPoints.map((p) => p.value);
    const axis = fp[1].clone().sub(fp[0]);

    const a = (this.dlCurrent * Math.PI) / 180;
    const q = new Quaternion().setFromAxisAngle(axis, a);

    const p = this.effortPoints.map((to) => to.value);
    const effortP = p[0].clone().sub(fp[0]).applyQuaternion(q).add(fp[0]);
    return p.length === 1 ? [effortP] : [effortP, p[1]];
  }

  getMeasurablePoints(): INamedVector3RO[] {
    const fp = this.fixedPoints.map((p) => p.value);
    const axis = fp[1].clone().sub(fp[0]);

    const a = (this.dlCurrent * Math.PI) / 180;
    const q = new Quaternion().setFromAxisAngle(axis, a);
    const p = this.effortPoints.map((to) => to.value);
    const effortP = p[0].clone().sub(fp[0]).applyQuaternion(q).add(fp[0]);
    let points = [
      new NamedVector3({
        name: `rodEnd${0}`,
        parent: this,
        value: effortP,
        update: () => {},
        nodeID: `${this.effortPoints[0].nodeID}_current`
      })
    ];
    if (this.effortPoints[1]) {
      points = [
        ...points,
        new NamedVector3({
          name: `rodEnd${1}`,
          parent: this,
          value: p[1],
          update: () => {},
          nodeID: `${this.effortPoints[1].nodeID}_current`
        })
      ];
    }
    return [...this.fixedPoints, ...points, this.centerOfGravity];
  }

  getPoints(): INamedVector3[] {
    return [...this.fixedPoints, ...this.effortPoints];
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
      centerOfGravity: cog
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
          effortPoints: OneOrTwo<
            FunctionVector3 | IDataVector3 | INamedVector3
          >;
          dlCurrentNodeID?: NodeID;
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3 | IDataVector3 | INamedVector3;
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
    const p = [...effortPoints];
    const point0 = p.shift()!;
    this.effortPoints = [
      new NamedVector3({
        name: `${this.pointName}1`,
        parent: this,
        value: point0
      }),
      ...p.map(
        (point, i) =>
          new NamedVector3({
            name: `${this.pointName}${i + 1}`,
            parent: this,
            value: point
          })
      )
    ] as OneOrTwo<NamedVector3>;

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

  getDataElement(state: GDState): IDataTorsionSpring {
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const mir = this.getAnotherElement(mirror);
    const baseData = super.getDataElementBase(state, mir);
    const {dlCurrentNodeID} = this;

    if (mir && isTorsionSpring(mir)) {
      return {
        ...baseData,
        fixedPoints: [
          this.fixedPoints[0]
            .setValue(mirrorVec(mir.fixedPoints[0]))
            .getData(state),
          this.fixedPoints[1]
            .setValue(mirrorVec(mir.fixedPoints[1]))
            .getData(state)
        ],
        effortPoints: this.effortPoints.map((to) => to.getData(state)) as any,
        dlCurrentNodeID
      };
    }
    return {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => point.getData(state)),
      effortPoints: this.effortPoints.map((to) => to.getData(state)) as any,
      dlCurrentNodeID
    };
  }
}