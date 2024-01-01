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

import {AtLeast1} from '@app/utils/atLeast';
import {v4 as uuidv4} from 'uuid';
import {GDState} from '@store/reducers/dataGeometryDesigner';
import {minus} from '@app/utils/helpers';
import {
  isDataElement,
  MirrorError,
  Elements,
  NodeID,
  ILinearBushing,
  IDataLinearBushing,
  isLinearBushing,
  assignMeta,
  isMirror
} from '../IElements';
import {Element, mirrorVec} from './ElementBase';

export class LinearBushing extends Element implements ILinearBushing {
  // eslint-disable-next-line class-methods-use-this
  get className(): Elements {
    return 'LinearBushing';
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
    return [...this.fixedPoints, ...points, this.centerOfGravity];
  }

  get supportDistance(): number {
    const fp = this.fixedPoints.map((p) => p.value);
    return fp[1].clone().sub(fp[0]).length();
  }

  getPoints(): INamedVector3[] {
    return [...this.fixedPoints, ...this.points];
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
          toPoints: AtLeast1<number | string | IDataNumber | INamedNumber>;
          dlMin: number;
          dlMax: number;
          dlCurrentNodeID?: NodeID;
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3 | IDataVector3 | INamedVector3;
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
  }

  getDataElement(state: GDState): IDataLinearBushing {
    const mirror = isMirror(this) ? this.meta?.mirror?.to : undefined;
    const mir = this.getAnotherElement(mirror);
    const baseData = super.getDataElementBase(state, mir);
    const {dlCurrentNodeID} = this;

    if (mir && isLinearBushing(mir)) {
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
        toPoints: this.toPoints.map((to) => to.getData(state)),
        dlCurrentNodeID,
        dlMin: this.dlMin.getData(state),
        dlMax: this.dlMax.getData(state)
      };
    }
    return {
      ...baseData,
      fixedPoints: this.fixedPoints.map((point) => point.getData(state)),
      toPoints: this.toPoints.map((to) => to.getData(state)),
      dlCurrentNodeID,
      dlMin: this.dlMin.getData(state),
      dlMax: this.dlMax.getData(state)
    };
  }
}
