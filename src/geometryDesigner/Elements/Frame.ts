import {NamedVector3} from '@gd/NamedValues';
import {INamedVector3RO, FunctionVector3} from '@gd/INamedValues';

import {Vector3} from 'three';
import {
  trans,
  isDataElement,
  Elements,
  IElement,
  assignMeta
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
    const body = this.frameBody;
    if (body) {
      const namedPoints = this.children.reduce(
        (prev: INamedVector3RO[], child) => {
          if (child === body) return prev;
          prev = [
            ...prev,
            ...child
              .getPoints()
              .filter((p) => !p.meta.isFreeNode || p.meta.enclosed)
          ];
          return prev;
        },
        [] as INamedVector3RO[]
      );
      body.fixedPoints.splice(0);
      body.fixedPoints.push(
        ...namedPoints.map(
          (p, i) =>
            new NamedVector3({
              name: `fixedPoint${i + 1}`,
              parent: body,
              value: trans(p)
            })
        )
      );
      this.joints = namedPoints.map((p, i) => ({
        lhs: p.nodeID,
        rhs: body.fixedPoints[i].nodeID
      }));
    }
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
        }
      | IDataFrame
  ) {
    if (!isDataElement(params)) {
      const {name, children, initialPosition, mass, centerOfGravity} = params;
      const namedPoints = children.reduce((prev: INamedVector3RO[], child) => {
        prev = [
          ...prev,
          ...child
            .getPoints()
            .filter((p) => !p.meta.isFreeNode || p.meta.enclosed)
        ];
        return prev;
      }, [] as INamedVector3RO[]);
      const points = namedPoints.map((p) => trans(p));
      const body = new Body({
        name: `bodyObject_${name}`,
        fixedPoints: points,
        points: [],
        initialPosition,
        mass,
        centerOfGravity,
        autoCalculateCenterOfGravity: true
      });
      assignMeta(body, {isBodyOfFrame: true});
      const joints = namedPoints.map((p, i) => ({
        lhs: p.nodeID,
        rhs: body.fixedPoints[i].nodeID
      }));
      super({name, children: [...children, body], joints});
      this.frameBody = body;
    } else {
      super(params);
      const body = this.children.find(
        (child) => child.nodeID === params.bodyID
      );
      if (body && isBody(body)) {
        assignMeta(body, {isBodyOfFrame: true});
        this.frameBody = body;
        const namedPoints = this.children.reduce(
          (prev: INamedVector3RO[], child) => {
            if (child === body) return prev;
            prev = [
              ...prev,
              ...child
                .getPoints()
                .filter((p) => !p.meta.isFreeNode || p.meta.enclosed)
            ];
            return prev;
          },
          [] as INamedVector3RO[]
        );
        body.fixedPoints.splice(0);
        body.fixedPoints.push(
          ...namedPoints.map(
            (p, i) =>
              new NamedVector3({
                name: `fixedPoint${i + 1}`,
                parent: body,
                value: trans(p)
              })
          )
        );
        this.joints = namedPoints.map((p, i) => ({
          lhs: p.nodeID,
          rhs: body.fixedPoints[i].nodeID
        }));
      } else {
        throw new Error('FrameのChildrenにBodyデータがない');
      }
    }
  }

  getDataElement(): IDataFrame | undefined {
    const data = super.getDataElement();
    if (!data) return undefined;
    return {...data, bodyID: this.frameBody.nodeID};
  }
}
