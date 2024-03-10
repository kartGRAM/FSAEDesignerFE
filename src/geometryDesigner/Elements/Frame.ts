import {NamedVector3} from '@gd/NamedValues';
import {INamedVector3RO, FunctionVector3} from '@gd/INamedValues';

import {Vector3} from 'three';
import {
  trans,
  Elements,
  IElement,
  assignMeta,
  isDataElement
} from '../IElements';
import {isBody, IBody} from '../IElements/IBody';
import {IDataFrame, className} from '../IElements/IFrame';
import {Assembly} from './Assembly';
import {Body} from './Body';

export class Frame extends Assembly {
  // eslint-disable-next-line class-methods-use-this
  get className(): Elements {
    return className;
  }

  readonly frameBody: IBody;

  arrange(parentPosition?: Vector3) {
    super.arrange(parentPosition);
    if (this.frameBody) this.syncBodyOfFrame({});
  }

  constructor(
    params:
      | {
          name: string;
          children: IElement[];
          initialPosition?: FunctionVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3;
          autoCalculateCenterOfGravity?: boolean;
          nodeID?: string;
        }
      | IDataFrame
  ) {
    super({
      name: params.name,
      children: params.children,
      joints: [],
      nodeID: params.nodeID,
      ignoreArrange: true
    });
    // ignoreArrangeされているため
    this._children.forEach((child) => {
      child.parent = this;
    });
    this.frameBody = this.syncBodyOfFrame(params);
    if (!isDataElement(params)) this.arrange();
  }

  syncBodyOfFrame(
    params:
      | {
          initialPosition?: FunctionVector3;
          mass?: number;
          centerOfGravity?: FunctionVector3;
          autoCalculateCenterOfGravity?: boolean;
          bodyID?: string;
        }
      | IDataFrame
  ): IBody {
    let body = this.frameBody as Body | undefined;
    if (!body) {
      body = this.children.find(
        (child) => child.nodeID === params.bodyID && isBody(child)
      ) as Body | undefined;
    }
    if (!body) {
      body = new Body({
        name: `bodyObject_${this.name.value}`,
        fixedPoints: [],
        points: [],
        initialPosition: params.initialPosition,
        mass: params.mass,
        centerOfGravity: params.centerOfGravity,
        autoCalculateCenterOfGravity:
          (params as any).autoCalculateCenterOfGravity ?? true
      });
      this.appendChild(body);
    }
    assignMeta(body, {isBodyOfFrame: true});
    const namedPoints = this.children.reduce(
      (prev: INamedVector3RO[], child) => {
        if (child === body) return prev;
        prev = [
          ...prev,
          ...child.getPoints().filter((p) => !p.meta.isFreeNode)
        ];
        return prev;
      },
      [] as INamedVector3RO[]
    );
    body.fixedPoints = namedPoints.map(
      (p, i) =>
        new NamedVector3({
          name: `fixedPoint${i + 1}`,
          parent: body,
          value: trans(p)
        })
    );
    this.joints = namedPoints.map((p, i) => ({
      lhs: p.nodeID,
      rhs: body!.fixedPoints[i].nodeID
    }));
    return body;
  }

  getDataElement(): IDataFrame | undefined {
    const data = super.getDataElement();
    if (!data) return undefined;
    return {...data, bodyID: this.frameBody.nodeID};
  }
}
