import {Vector3} from 'three';
import {NamedNumber} from '@gd/NamedValues';
import {
  INamedNumberRO,
  IDataVector3,
  INamedVector3,
  FunctionVector3
} from '@gd/INamedValues';

import {v4 as uuidv4} from 'uuid';
import {
  MirrorError,
  Elements,
  NodeID,
  assignMeta,
  isMirror
} from '../IElements';

import {
  ISpringDumper,
  IDataSpringDumper,
  className
} from '../IElements/ISpringDumper';
import {mirrorVec} from './ElementBase';
import {Bar} from './Bar';

export class SpringDumper extends Bar implements ISpringDumper {
  // eslint-disable-next-line class-methods-use-this
  get className(): Elements {
    return className;
  }

  unit = 'mm' as const;

  controllable = true as const;

  getMirror(): SpringDumper {
    if (isMirror(this)) throw new MirrorError('ミラーはミラーできない');
    const fp = mirrorVec(this.fixedPoint);
    const p = mirrorVec(this.point);
    const ip = mirrorVec(this.initialPosition);
    const cog = mirrorVec(this.centerOfGravity);
    const ret = new SpringDumper({
      name: `mirror_${this.name.value}`,
      fixedPoint: fp,
      point: p,
      initialPosition: ip,
      mass: this.mass.value,
      centerOfGravity: cog,
      dlMin: this.dlMin.value,
      dlMax: this.dlMax.value,
      autoCalculateCenterOfGravity: this.autoCalculateCenterOfGravity.value
    });
    assignMeta(ret, {mirror: {to: this.nodeID}});
    return ret;
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
        point: this.currentPoint,
        nodeID: this.point.nodeID,
        force: this.pointForce
      }
    ];
  }

  dlMin: NamedNumber;

  dlMax: NamedNumber;

  dlCurrentNodeID: string;

  dlCurrent: number = 0;

  get currentPoint() {
    const fp = this.fixedPoint.value;
    const p = this.point.value;
    p.sub(fp)
      .normalize()
      .multiplyScalar(this.length + this.dlCurrent)
      .add(fp);
    return p;
  }

  get isLimited() {
    return (
      Math.abs(this.dlCurrent - this.dlMin.value) < 1e-5 ||
      Math.abs(this.dlCurrent - this.dlMax.value) < 1e-5
    );
  }

  arrange(parentPosition?: Vector3) {
    this.dlCurrent = 0;
    super.arrange(parentPosition);
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

  constructor(
    params:
      | {
          name: string;
          fixedPoint: FunctionVector3 | IDataVector3 | INamedVector3;
          point: FunctionVector3 | IDataVector3 | INamedVector3;
          dlMin: number;
          dlMax: number;
          dlCurrentNodeID?: NodeID;
          initialPosition?: FunctionVector3 | IDataVector3 | INamedVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3 | IDataVector3 | INamedVector3;
          autoCalculateCenterOfGravity?: boolean;
        }
      | IDataSpringDumper
  ) {
    super(params);
    this.dlCurrentNodeID = params.dlCurrentNodeID ?? uuidv4();
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
  }

  getDataElement(): IDataSpringDumper {
    const baseData = super.getDataElement();
    const {dlCurrentNodeID} = this;
    const data: IDataSpringDumper = {
      ...baseData,
      dlMin: this.dlMin.getData(),
      dlMax: this.dlMax.getData(),
      dlCurrentNodeID
    };
    return data;
  }
}
